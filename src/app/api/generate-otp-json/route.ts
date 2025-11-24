import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { generateOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { username, token } = await req.json();

    if (!username || !token) {
      return NextResponse.json({ error: "⚠️ Missing username or token" }, { status: 400 });
    }

    const secret = process.env.OTP_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "❌ OTP_SECRET not loaded" }, { status: 500 });
    }

    const currentOtp = generateOtp(secret);

    if (token !== currentOtp) {
      return NextResponse.json({ error: "❌ Invalid or expired OTP" }, { status: 400 });
    }

    // OTP valid → issue JWT
    const payload = { username, role: "admin" };
    const sessionToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

    return NextResponse.json({ token: sessionToken, role: "admin", message: "✅ 2FA imefanikiwa!" });
  } catch (err: any) {
    return NextResponse.json({ error: `⚠️ Server error: ${err.message}` }, { status: 500 });
  }
}
