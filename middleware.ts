import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PUBLIC_PATHS = ["/login", "/blocked", "/failed", "/api/auth/login"];

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin",
  usher: "/usher",
  pastor: "/pastor",
  finance: "/finance",
  media: "/media",
};

export async function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const { pathname } = req.nextUrl;
  const visitedHome = req.cookies.get("visitedHome");

  // 1. Public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Chrome browser only
  const isChrome =
    /\bChrome\/\d+/.test(ua) &&
    ua.includes("Safari/537.36") &&
    !ua.includes("Edg") &&
    !ua.includes("OPR") &&
    !ua.includes("Brave") &&
    !ua.includes("Vivaldi") &&
    !ua.includes("SamsungBrowser");

  if (!isChrome) {
    const url = req.nextUrl.clone();
    url.pathname = "/blocked";
    return NextResponse.redirect(url);
  }

  // 3. Visit home first
  if (pathname === "/") {
    const res = NextResponse.next();
    res.cookies.set("visitedHome", "true", {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1800,
    });
    return res;
  }

  if (!visitedHome) {
    return NextResponse.redirect(new URL("/failed", req.url));
  }

  // 4. Get token
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  // 5. Verify JWT
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!decoded.sessionId)
    return NextResponse.redirect(new URL("/login", req.url));

  // 6. Validate session
  const { data: user, error } = await supabase
    .from("users")
    .select("role, sessions")
    .eq("id", decoded.id)
    .single();

  if (error || !user)
    return NextResponse.redirect(new URL("/login", req.url));

  const validSession = (user.sessions || []).includes(decoded.sessionId);
  if (!validSession)
    return NextResponse.redirect(new URL("/login", req.url));

  const userRole = user.role;
  const roleHome = ROLE_ROUTES[userRole];

  // 7. Auto redirect after login
  if (pathname === "/home") {
    if (roleHome) {
      const url = req.nextUrl.clone();
      url.pathname = roleHome;
      return NextResponse.redirect(url);
    }
  }

  // 8. Block unauthorized role area
  for (const role in ROLE_ROUTES) {
    const route = ROLE_ROUTES[role];
    if (pathname.startsWith(route) && userRole !== role) {
      return NextResponse.redirect(new URL("/failed", req.url));
    }
  }

  // 9. Logout
  if (pathname === "/logout") {
    const res = NextResponse.next();
    res.cookies.delete("visitedHome");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)",
  ],
};
