import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 👇 Soma cookie ya session_token
    const cookieStore = cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or malformed token" }, { status: 401 });
    }

    // 👇 Fetch user info using username (since JWT has username + role)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, email, role, full_name, branch, profile_url, last_login, metadata")
      .eq("username", decoded.username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define all possible panels and tabs
    const allPanels = ["admin", "usher", "pastor", "media", "finance"];
    const allTabIds = [
      "tabManager", "reactivation", "users", "registration", "data", "matangazo",
      "storage", "settings", "profile",
      "home", "usajili", "mafunzo", "reports", "messages", "picha",
      "muumini", "mahadhurio", "wokovu", "ushuhuda",
      "dashboard", "bajeti", "summary", "approval", "approved", "rejected",
      "media", "usage", "finance", "michango", "reports_finance"
    ];

    let allowedTabs: string[] = [];

    if (user.role === "admin") {
      allowedTabs = [...allPanels, ...allTabIds];
    } else {
      allowedTabs = [user.role, ...(user.metadata?.allowed_tabs || [])];
    }

    return NextResponse.json({ ...user, allowedTabs }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
