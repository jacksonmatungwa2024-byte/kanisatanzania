import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Taarifa hazijakamilika" },
        { status: 400 }
      );
    }

    // 🔎 Fetch user
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, full_name, role, phone, password_hash, sessions")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Username au password sio sahihi" },
        { status: 401 }
      );
    }

    // 🔐 Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Username au password sio sahihi" },
        { status: 401 }
      );
    }

    // 🧠 Create session
    const sessionId = crypto.randomUUID();
    const existingSessions = Array.isArray(user.sessions)
      ? user.sessions
      : [];

    const updatedSessions = [...existingSessions, sessionId];

    // 💾 Save session to DB
    await supabase
      .from("users")
      .update({
        sessions: updatedSessions,
        last_login: new Date().toISOString(),
      })
      .eq("id", user.id);

    // 🔑 Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        sessionId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    // ✅ Response
    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone,
      },
    });

    // 🍪 Secure cookie
    response.cookies.set({
      name: "auth",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
