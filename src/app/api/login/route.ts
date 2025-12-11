// app/api/login/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Fetch user from DB
  const { data: user, error } = await supabase
    .from("users")
    .select("username, full_name, role, phone, password_hash")
    .eq("username", username)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Username haipo au password sio sahihi" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return NextResponse.json({ error: "Username au password sio sahihi" }, { status: 401 });
  }

  // --- set cookies ---
  const response = NextResponse.json({ success: true });

  const isProd = process.env.NODE_ENV === "production";

  // Use lax for localhost, none+secure for production
  const cookieOptions = {
    httpOnly: true,
    secure: isProd, // must be true in production (HTTPS)
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };

  response.cookies.set("auth_user", user.username, cookieOptions);
  response.cookies.set("auth_role", user.role, cookieOptions);
  response.cookies.set("auth_name", user.full_name, cookieOptions);
  response.cookies.set("auth_phone", user.phone, cookieOptions);

  return response;
}
