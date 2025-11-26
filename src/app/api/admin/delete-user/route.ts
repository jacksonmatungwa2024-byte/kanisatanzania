import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, username } = await req.json();
    const userId = id ? Number(id) : null;

    // 🔐 Auth check via cookie
    const cookieStore = cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🟢 Special case: PIN login (no username in JWT)
    const isPinLogin = decoded.loginMode === "pin";

    // 🗑️ Try delete by ID if provided
    if (userId) {
      const { error, count } = await supabase
        .from("users")
        .delete({ count: "exact" })
        .eq("id", userId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (count && count > 0) return NextResponse.json({ success: true, deletedBy: "id" }, { status: 200 });
    }

    // 🗑️ Fallback: try delete by username
    if (username) {
      const { error, count } = await supabase
        .from("users")
        .delete({ count: "exact" })
        .eq("username", username);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (count && count > 0) return NextResponse.json({ success: true, deletedBy: "username" }, { status: 200 });
    }

    // ❌ If neither ID nor username matched
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
