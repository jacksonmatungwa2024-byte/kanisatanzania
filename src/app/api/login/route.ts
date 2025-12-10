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
    return NextResponse.json({ error: "Username haipo" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return NextResponse.json(
      { error: "Password sio sahihi" },
      { status: 401 }
    );
  }

  // --- set cookies ---
  const response = NextResponse.json({ success: true });

  response.cookies.set("auth_user", user.username, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  response.cookies.set("auth_role", user.role, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  response.cookies.set("auth_name", user.full_name, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  response.cookies.set("auth_phone", user.phone, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  return response;
}
