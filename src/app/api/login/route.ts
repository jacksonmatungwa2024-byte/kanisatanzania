import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // Find user
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash, role, sessions")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Password verification
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    // Generate JWT token (30 days)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    // Save token in sessions array (keep last 10 sessions)
    const updatedSessions = [...(user.sessions || []), token].slice(-10);
    const { error: updateError } = await supabase
      .from("users")
      .update({ sessions: updatedSessions })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update sessions:", updateError.message);
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    // Return token and user info to frontend
    return NextResponse.json(
      { token, role: user.role, username: user.username },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
