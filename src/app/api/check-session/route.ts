import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // 🔐 Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 🧍 Fetch user info
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, role, branch, profile_url, last_login, sessions")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔐 Validate session
    const validSession = (user.sessions || []).includes(decoded.sessionId);
    if (!validSession) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 🎚 ROLE → ALLOWED TABS
    const roleTabs: Record<string, string[]> = {
      admin: ["admin", "usher", "pastor", "media", "finance"],
      pastor: ["pastor"],
      usher: ["usher"],
      media: ["media"],
      finance: ["finance"]
    };

    const allowedTabs = roleTabs[user.role] || [];

    // 🎉 Return all user info
    return NextResponse.json({
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      branch: user.branch,
      profile_url: user.profile_url,
      last_login: user.last_login,
      allowedTabs,
      sessionValid: true
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
