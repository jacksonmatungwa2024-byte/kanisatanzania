import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, role, metadata, active_until") // 👈 sasa username
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Fetch users error:", error.message);
    return [];
  }

  return data;
}
