import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: "public" } }
);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // 📌 Fetch only needed fields, no count option
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash, role, sessions") // ✅ removed count: "off"
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 📌 Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    // 📌 Generate a lightweight session ID
    const sessionId = randomUUID();

    // 📌 Sign a compact JWT
    const token = jwt.sign(
      { uid: user.id, sid: sessionId },
      process.env.JWT_SECRET!,
      { expiresIn: "30m" }
    );

    // 📌 Update user's sessions (keep last 10)
    const updatedSessions = Array.isArray(user.sessions) ? [...user.sessions] : [];
    updatedSessions.push(sessionId);
    if (updatedSessions.length > 10) updatedSessions.shift();

    await supabase
      .from("users")
      .update({ sessions: updatedSessions })
      .eq("id", user.id);

    // 📌 Send token as secure cookie + JSON response
    const response = NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      token,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 30, // 30 minutes
    });

    return response;

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
