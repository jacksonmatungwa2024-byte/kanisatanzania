import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 🔐 Read token from HTTP-only cookie
    const token = cookies().get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded.id || !decoded.sessionId) {
      return NextResponse.json(
        { error: "Invalid token structure" },
        { status: 401 }
      );
    }

    // 🔎 Fetch user
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        username,
        email,
        role,
        full_name,
        branch,
        profile_url,
        last_login,
        metadata,
        sessions
      `)
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🧠 Validate active session
    const userSessions = Array.isArray(user.sessions) ? user.sessions : [];

    if (!userSessions.includes(decoded.sessionId)) {
      return NextResponse.json(
        { error: "Session expired, please login again" },
        { status: 401 }
      );
    }

    // 🔐 Role → allowed tabs
    const allPanels = ["admin", "usher", "pastor", "media", "finance"];

    const allTabIds = [
      "tabManager","reactivation","users","registration","data","matangazo",
      "storage","settings","profile","home","usajili","mafunzo","reports","messages",
      "picha","muumini","mahadhurio","wokovu","ushuhuda","dashboard","bajeti",
      "summary","approval","approved","rejected","media","usage","finance",
      "michango","reports_finance"
    ];

    let allowedTabs: string[] = [];

    if (user.role === "admin") {
      allowedTabs = [...allPanels, ...allTabIds];
    } else {
      allowedTabs = [user.role, ...(user.metadata?.allowed_tabs || [])];
    }

    // ✅ Return safe user payload
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      branch: user.branch,
      profile_url: user.profile_url,
      last_login: user.last_login,
      metadata: user.metadata || {},
      allowed_tabs: allowedTabs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
