import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, password, pin } = await req.json();

    // **************************************
    // 1️⃣ ADMIN PIN LOGIN (NO USERNAME NEEDED)
    // **************************************
    if (pin) {
      const { data: adminPin } = await supabase
        .from("admin_pins")
        .select("*")
        .eq("pin", pin)
        .single();

      if (adminPin) {
        // 🔐 Create Admin session token
        const token = jwt.sign(
          { role: "admin", loginMode: "pin" },
          process.env.JWT_SECRET!,
          { expiresIn: "2h" }
        );

        // 🟢 Store session in DB
        await supabase
          .from("admin_pins")
          .update({ current_session: token })
          .eq("id", adminPin.id);

        return NextResponse.json({
          success: true,
          role: "admin",
          loginMode: "pin",
          token,
        });
      }
    }

    // **************************************
    // 2️⃣ Normal Login
    // **************************************
    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing username or password" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { error: "Akaunti haijapatikana." },
        { status: 400 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Akaunti imefungwa." },
        { status: 403 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Nenosiri si sahihi." },
        { status: 401 }
      );
    }

    // **************************************
    // 3️⃣ Generate DB session token
    // **************************************
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    // **************************************
    // 4️⃣ Save session to DB
    // **************************************
    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        current_session: token,
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      role: user.role,
      loginMode: "normal",
      token, // front-end stores this in localStorage
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Server Error: ${err.message}` },
      { status: 500 }
    );
  }
}
