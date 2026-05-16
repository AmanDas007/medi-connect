import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = Boolean(token);

  // Patient protected routes only
  const isPatientRoute =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/prescriptions") ||
    pathname.startsWith("/consultation") ||
    pathname.startsWith("/review") ||
    pathname.startsWith("/feedback");

  // Doctor protected routes
  const isDoctorRoute = pathname.startsWith("/doctor");

  // Auth routes
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/verify-otp") ||
    pathname.startsWith("/reset-password");

  // 1. If not logged in and trying protected patient/doctor route
  if (!isLoggedIn && (isPatientRoute || isDoctorRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If patient tries doctor route
  if (isLoggedIn && isDoctorRoute && token.role !== "doctor") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. If doctor tries patient route
  if (isLoggedIn && isPatientRoute && token.role !== "patient") {
    return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
  }

  // 4. If already logged in and visiting login/register pages
  if (isLoggedIn && isAuthRoute) {
    if (token.role === "patient") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (token.role === "doctor") {
      return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/appointments/:path*",
    "/prescriptions/:path*",
    "/consultation/:path*",
    "/review/:path*",
    "/feedback/:path*",

    "/doctor/:path*",

    "/login",
    "/register",
    "/register/doctor",
    "/forgot-password",
    "/verify-otp",
    "/reset-password",
  ],
};