import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const token = req.cookies.get("session_token")?.value;

    if (token) {
      // clear current_session in DB
      await supabase
        .from("users")
        .update({ current_session: null })
        .eq("current_session", token);
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0, // expire immediately
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
