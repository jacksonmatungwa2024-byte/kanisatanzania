// Hakuna Supabase client hapa kwa sababu tunaita API route yetu ya backend
// ambayo tayari inatumia SERVICE_ROLE_KEY na bypasses RLS

export async function deleteUser(userId?: number, username?: string): Promise<void> {
  try {
    // Build request body: either id or username
    const body: any = {};
    if (userId) body.id = userId;
    if (username) body.username = username;

    if (!body.id && !body.username) {
      alert("❌ Hakuna userId wala username uliyopeana.");
      return;
    }

    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include", // 👈 cookie ya session_token itatumwa automatically
    });

    const data = await res.json();

    if (data.error) {
      alert(`❌ ${data.error}`);
      return;
    }

    alert(`✅ Mtumiaji amefutwa kikamilifu kwa ${data.deletedBy || "id/username"}.`);
  } catch (err) {
    console.error("Delete exception:", err);
    alert("❌ Tatizo kufuta mtumiaji.");
  }
}
