// /app/api/security-check/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // ✅ Hii ni muhimu

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("host") || "unknown";
    const ua = req.headers.get("user-agent") || "";

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ status: "unauthorized", message: "No token", ip });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ status: "invalid_token", message: "Token expired or invalid", ip });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, sessions")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ status: "user_not_found", ip });
    }

    const validSession = Array.isArray(user.sessions) && user.sessions.includes(decoded.sessionId);
    if (!validSession) {
      return NextResponse.json({ status: "invalid_session", ip });
    }

    const isChrome =
      /\bChrome\/\d+/.test(ua) &&
      ua.includes("Safari/537.36") &&
      !ua.includes("Edg") &&
      !ua.includes("OPR") &&
      !ua.includes("Brave") &&
      !ua.includes("Vivaldi") &&
      !ua.includes("SamsungBrowser") &&
      !ua.includes("Phoenix") &&
      !ua.includes("CriOS") &&
      !ua.includes("Electron") &&
      !ua.includes("Chromium");

    if (!isChrome) {
      return NextResponse.json({ status: "blocked_browser", message: "Unsupported browser", ip });
    }

    // Fetch location
    let location = { city: "unknown", region: "unknown", country: "unknown" };
    try {
      const locRes = await fetch(`http://ip-api.com/json/${ip}`);
      location = await locRes.json();
    } catch {}

    console.log(`[SECURITY] User ${decoded.id} passed security check at ${new Date().toISOString()} from IP: ${ip}`);

    return NextResponse.json({
      status: "safe",
      message: "User passed security check",
      timestamp: new Date().toISOString(),
      ip,
      location,
      browser: ua,
    });
  } catch (err: any) {
    console.error(`[SECURITY] Error: ${err.message}`);
    return NextResponse.json({ status: "error", message: err.message });
  }
}
