import { NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp"; // ensure this function exists

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adminPassword = searchParams.get("password");

  if (adminPassword !== "2021") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.OTP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "OTP_SECRET not loaded ❌" }, { status: 500 });
  }

  const otp = generateOtp(secret);
  return NextResponse.json({ otp });
}
