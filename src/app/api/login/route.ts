import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

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

    // Fetch user
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash, role, sessions")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    // Create sessionId
    const sessionId = randomUUID();

    // Create JWT with sessionId
    const token = jwt.sign(
      { id: user.id, sessionId },
      process.env.JWT_SECRET!,
      { expiresIn: "30mins" }
    );

    // Save sessionId only
    const updatedSessions = [...(user.sessions || []), sessionId].slice(-10);

    await supabase
      .from("users")
      .update({ sessions: updatedSessions })
      .eq("id", user.id);

    return NextResponse.json(
      { token, role: user.role, username: user.username },
      { status: 200 }
    );

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
