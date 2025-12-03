import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    const token = auth.split(" ")[1];

    // 🔍 Tafuta user aliyepo na token hii
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .contains("sessions", [token])
      .maybeSingle();

    if (fetchError || !user) {
      return NextResponse.json({ error: "Session not found or already logged out" }, { status: 404 });
    }

    // ✅ Ondoa all sessions
    const { error: updateError } = await supabase
      .from("users")
      .update({ sessions: [] })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Logged out from all devices" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
