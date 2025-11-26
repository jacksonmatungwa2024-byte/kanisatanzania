import { NextResponse } from "next/server";
import { cookies } from "next/headers";   // 👈 tumia hii
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // 👇 tumia cookies() badala ya req.cookies
    const cookieStore = cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
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
