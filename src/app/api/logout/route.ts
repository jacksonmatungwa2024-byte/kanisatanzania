import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Token invalid or expired" }, { status: 401 });
    }

    // 🔥 Token MUST have sessionId
    if (!decoded.sessionId) {
      return NextResponse.json({ error: "Invalid token structure" }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, sessions")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔥 REMOVE sessionId, not token
    const updatedSessions = (user.sessions || []).filter(
      (s: string) => s !== decoded.sessionId
    );

    await supabase
      .from("users")
      .update({ sessions: updatedSessions })
      .eq("id", user.id);

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
