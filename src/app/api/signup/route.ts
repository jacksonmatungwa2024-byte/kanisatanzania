import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { password, full_name, role, branch, username, phone, profileUrl } = await req.json();

    if (!password || !full_name || !role || !username) {
      return NextResponse.json({ error: "⚠️ Missing required fields" }, { status: 400 });
    }

    // Check if username exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "❌ Username tayari imesajiliwa" }, { status: 400 });
    }

    // Insert user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name,
          role,
          branch,
          username,
          phone,
          profile_url: profileUrl,
          is_active: true,
          metadata: { allowed_tabs: [] },
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `❌ DB error: ${error.message}` }, { status: 400 });
    }

    // Normal users → JWT direct
    if (role !== "admin") {
      const payload = { username: data.username, role: data.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });
      return NextResponse.json({ token, role: data.role });
    }

    // Admin → pending OTP
    return NextResponse.json({
      message: "🔐 Admin created. Tafadhali thibitisha OTP.",
      pendingUser: data.username,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `⚠️ Server error: ${err.message}` }, { status: 500 });
  }
}
