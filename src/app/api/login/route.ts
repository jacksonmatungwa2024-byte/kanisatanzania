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
    return NextResponse.json(
      { error: "Username haipo au password sio sahihi" },
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

  // --- return user info directly, no cookies ---
  return NextResponse.json({
    success: true,
    user: {
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      phone: user.phone,
    },
  });
}
