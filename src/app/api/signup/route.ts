import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { password, full_name, role, branch, username, phone } = await req.json();

    // Validate required fields
    if (!password || !full_name || !role || !username) {
      return NextResponse.json({ error: "⚠️ Missing required fields" }, { status: 400 });
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "❌ Username tayari imesajiliwa" }, { status: 400 });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name,
          role,
          branch,
          username,
          phone,
          password_hash,
          profile_url: null,        // No profile picture
          is_active: true,
          metadata: { allowed_tabs: [] },
          otp_verified: false,
          login_attempts: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `❌ DB error: ${error.message}` }, { status: 400 });
    }

    // Create JWT token
    const payload = { username: data.username, role: data.role, id: data.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "2h" });

    return NextResponse.json({ token, role: data.role });
  } catch (err: any) {
    return NextResponse.json({ error: `⚠️ Server error: ${err.message}` }, { status: 500 });
  }
}
