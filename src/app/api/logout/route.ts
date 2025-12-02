import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 🔐 Get token from Authorization header
    const auth = req.headers.get("authorization");

    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    const token = auth.split(" ")[1];

    // 🔍 Fetch user whose sessions array contains this token
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, sessions")
      .contains("sessions", [token])
      .maybeSingle();

    if (fetchError || !user) {
      return NextResponse.json({ error: "Session not found or already logged out" }, { status: 404 });
    }

    // ✅ Remove the token from sessions array
    const updatedSessions = (user.sessions || []).filter((t: string) => t !== token);

    const { error: updateError } = await supabase
      .from("users")
      .update({ sessions: updatedSessions })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
