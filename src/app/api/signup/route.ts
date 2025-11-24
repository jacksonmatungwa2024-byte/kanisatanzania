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

    // Basic validation
    if (!password || !full_name || !role || !username) {
      return NextResponse.json({ error: "⚠️ Missing required fields" }, { status: 400 });
    }

    // 🔍 Check if username already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "❌ Username tayari imesajiliwa" }, { status: 400 });
    }

    // ⏳ Set active_until based on role
    let activeUntilDate: string | null = null;
    if (role !== "admin") {
      const fallback = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      activeUntilDate = fallback.toISOString();
    }

    // ✅ Insert user
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
          active_until: activeUntilDate,
          metadata: { allowed_tabs: [] },
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `❌ DB error: ${error.message}` }, { status: 400 });
    }

    // 🎯 Ikiwa sio admin → JWT token moja kwa moja
    if (role !== "admin") {
      const payload = {
        username: data.username,
        role: data.role,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });
      return NextResponse.json({ token, role: data.role });
    }

    // 🎯 Ikiwa admin → rudisha ujumbe wa OTP verification
    return NextResponse.json({
      message: "🔐 Admin created. Tafadhali thibitisha OTP kupitia /api/generate-otp-json na /api/verify-2fa.",
      pendingUser: data.username,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `⚠️ Server error: ${err.message}` }, { status: 500 });
  }
}
