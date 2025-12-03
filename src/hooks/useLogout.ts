export async function logout() {
  try {
    const token = localStorage.getItem("token"); // au cookie/session
    if (!token) return;

    // 🔹 Call backend logout
    await fetch("/api/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    // 🔹 Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 🔹 Redirect to login page
    window.location.href = "/login";
  } catch (err) {
    console.error("Logout failed:", err);
  }
}
