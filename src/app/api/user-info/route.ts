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
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Fetch user
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        username,
        full_name,
        role,
        branch,
        metadata,
        sessions,
        email,
        profile_url,
        last_login
      `)
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate session
    const validSession =
      Array.isArray(user.sessions) &&
      user.sessions.includes(decoded.sessionId);

    if (!validSession) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Compute allowed tabs
    const allPanels = ["admin", "usher", "pastor", "media", "finance"];
    const allTabIds = [
      "tabManager","reactivation","users","registration","data","matangazo",
      "storage","settings","profile","home","usajili","mafunzo","reports","messages",
      "picha","muumini","mahadhurio","wokovu","ushuhuda","dashboard","bajeti",
      "summary","approval","approved","rejected","media","usage","finance",
      "michango","reports_finance"
    ];

    let allowedTabs: string[] = [];

    if (user.role === "admin") {
      allowedTabs = [...allPanels, ...allTabIds];
    } else {
      allowedTabs = [user.role, ...(user.metadata?.allowed_tabs || [])];
    }

    // Successful response
    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        branch: user.branch,
        profile_url: user.profile_url,
        last_login: user.last_login,
        role: user.role,
        metadata: user.metadata || {},
        allowedTabs,
      },
      { status: 200 }
    );

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  }
