import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const PUBLIC_PATHS = ["/login", "/blocked", "/failed", "/api/login"];

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin",
  usher: "/usher",
  pastor: "/pastor",
  finance: "/finance",
  media: "/media",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public pages
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Read JWT from HTTP-only cookie
  const token = req.cookies.get("session_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Verify JWT
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const userRole = decoded.role;
  const sessionId = decoded.sessionId;
  const userId = decoded.id;

  if (!userId || !sessionId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Redirect user according to role when opening /home
  if (pathname === "/home" && ROLE_ROUTES[userRole]) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_ROUTES[userRole];
    return NextResponse.redirect(url);
  }

  // 5. Prevent user from entering unauthorized role route
  for (const role in ROLE_ROUTES) {
    const route = ROLE_ROUTES[role];
    if (pathname.startsWith(route) && role !== userRole) {
      return NextResponse.redirect(new URL("/failed", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)",
  ],
};
