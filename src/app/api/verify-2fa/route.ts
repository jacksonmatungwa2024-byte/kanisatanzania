import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, token } = await req.json();

    // Basic validation
    if (!username || !token) {
      return NextResponse.json(
        { error: "⚠️ Missing username or token" },
        { status: 400 }
      );
    }
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: "⚠️ Token must be 6 digits" },
        { status: 400 }
      );
    }

    // 🔍 Pata secret kutoka DB kwa kutumia username
    const { data, error } = await supabase
      .from("users")
      .select("totp_secret, role, metadata")
      .eq("username", username)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "❌ User not found" }, { status: 404 });
    }

    if (!data.totp_secret) {
      return NextResponse.json(
        { error: "⚠️ No 2FA secret set for this user" },
        { status: 400 }
      );
    }

    // 🔐 Verify token kwa step ya sekunde 30 (standard TOTP)
    const verified = speakeasy.totp.verify({
      secret: data.totp_secret,
      encoding: "base32",
      token,
      step: 30,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json(
        { error: "❌ Invalid or expired 2FA code" },
        { status: 400 }
      );
    }

    // ✅ Generate JWT baada ya verification
    const allowedTabs = data.metadata?.allowed_tabs || [];

    const payload = {
      username,
      role: data.role,
      allowedTabs,
    };

    const sessionToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    return NextResponse.json({
      token: sessionToken,
      role: data.role,
      allowedTabs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `⚠️ Server error: ${err.message}` }, { status: 500 });
  }
}
