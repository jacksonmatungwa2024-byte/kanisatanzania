import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Token invalid" }, { status: 401 });
    }

    if (!decoded.sessionId) {
      return NextResponse.json({ error: "Invalid token structure" }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        username,
        email,
        role,
        full_name,
        branch,
        profile_url,
        last_login,
        metadata,
        sessions
      `)
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userSessions = Array.isArray(user.sessions) ? user.sessions : [];

    if (!userSessions.includes(decoded.sessionId)) {
      return NextResponse.json(
        { error: "Session expired, please login again" },
        { status: 401 }
      );
    }

    const allPanels = ["admin", "usher", "pastor", "media", "finance"];

    const allTabIds = [
      "tabManager","reactivation","users","registration","data","matangazo",
      "storage","settings","profile","home","usajili","mafunzo","reports","messages",
      "picha","muumini","mahadhurio","wokovu","ushuhuda","dashboard","bajeti",
      "summary","approval","approved","rejected","media","usage","finance","michango",
      "reports_finance"
    ];

    let allowedTabs: string[] = [];

    if (user.role === "admin") {
      allowedTabs = [...allPanels, ...allTabIds];
    } else {
      allowedTabs = [user.role, ...(user.metadata?.allowed_tabs || [])];
    }

        return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      branch: user.branch,
      profile_url: user.profile_url,
      last_login: user.last_login,
      metadata: user.metadata || {},
      sessions: user.sessions || [],
      allowed_tabs: allowedTabs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
          }
