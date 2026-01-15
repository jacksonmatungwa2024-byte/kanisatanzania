import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Taarifa hazijakamilika" },
      { status: 400 }
    );
  }

  // Fetch user
  const { data: user, error } = await supabase
    .from("users")
    .select("username, full_name, role, phone, password_hash")
    .eq("username", username)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: "Username au password sio sahihi" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Username au password sio sahihi" },
      { status: 401 }
    );
  }

  // ✅ Create response
  const response = NextResponse.json({
    success: true,
    user: {
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      phone: user.phone,
    },
  });

  // ✅ Set secure HTTP-only cookie
  response.cookies.set({
    name: "auth",
    value: JSON.stringify({
      username: user.username,
      role: user.role,
      name: user.full_name,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return response;
}
