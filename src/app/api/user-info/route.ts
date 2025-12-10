// app/api/user-info/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Chukua username na role kutoka cookies zilizowekwa login
  const username = req.cookies.get("auth_user")?.value;
  const role = req.cookies.get("auth_role")?.value;

  if (!username || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("username, full_name, role, phone, branch, profile_url, last_login")
    .eq("username", username)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Map ya allowedTabs kulingana na role
  const roleTabsMap: Record<string, string[]> = {
    admin: ["admin", "usher", "pastor", "media", "finance"],
    usher: ["usher"],
    pastor: ["pastor"],
    media: ["media"],
    finance: ["finance"],
  };

  const allowedTabs = roleTabsMap[user.role] || [];

  return NextResponse.json({
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    phone: user.phone,
    branch: user.branch,
    profile_url: user.profile_url,
    last_login: user.last_login,
    allowedTabs,
  });
}
