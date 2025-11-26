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

    // 🔑 Check constant admin PIN first
    if (pin) {
      const { data: adminPin } = await supabase
        .from("admin_pins")
        .select("*")
        .eq("pin", pin)
        .single();

      if (adminPin) {
        // 🎯 Generate admin JWT directly
        const token = jwt.sign(
          { role: "admin", loginMode: "pin" },
          process.env.JWT_SECRET!,
          { expiresIn: "1h" } // expire after 1 hour
        );

        const response = NextResponse.json(
          { success: true, role: "admin", loginMode: "pin" },
          { status: 200 }
        );

        response.cookies.set("session_token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60, // 1 hour
        });

        return response;
      }
    }

    // 👇 Normal username/password login
    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Akaunti haikupatikana." }, { status: 400 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Akaunti imefungwa." }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Nenosiri si sahihi." }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" } // expire after 1 hour
    );

    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString(), current_session: token })
      .eq("id", user.id);

    const response = NextResponse.json(
      { success: true, role: user.role, loginMode: "normal" },
      { status: 200 }
    );

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
