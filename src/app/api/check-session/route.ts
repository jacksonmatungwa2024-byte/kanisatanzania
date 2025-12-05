import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Token missing" }, { status: 401 });

    const token = authHeader.split(" ")[1];

    let decoded: any;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET!); } 
    catch { return NextResponse.json({ error: "Token invalid or expired" }, { status: 401 }); }

    const { data: user, error } = await supabase.from("users").select("id, username, role, sessions").eq("id", decoded.id).single();
    if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.sessions?.includes(token)) return NextResponse.json({ error: "Session expired, please login again" }, { status: 401 });

    return NextResponse.json({ id: user.id, username: user.username, role: user.role }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
