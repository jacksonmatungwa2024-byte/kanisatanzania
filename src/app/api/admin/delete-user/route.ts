import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key bypasses RLS
);

export async function POST(req: Request) {
  try {
    const { id, username } = await req.json();
    const userId = id ? Number(id) : null;

    // 🔐 Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🗑️ Try delete by ID first
    const { error, count } = await supabase
      .from("users")
      .delete({ count: "exact" })
      .eq("id", userId ?? -1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If no rows deleted by ID, try by username
    if (!count && username) {
      const result = await supabase
        .from("users")
        .delete({ count: "exact" })
        .eq("username", username);

      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }

      if (!result.count) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, deletedBy: "username" }, { status: 200 });
    }

    if (!count) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedBy: "id" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
