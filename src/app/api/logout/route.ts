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

    // ❗ Clear current_session from DB
    const { data, error } = await supabase
      .from("users")
      .update({ current_session: null })
      .eq("current_session", token)
      .select("id, username");

    if (error) {
      return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Session not found or already logged out" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
