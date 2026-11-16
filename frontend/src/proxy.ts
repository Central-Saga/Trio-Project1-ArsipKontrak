import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getApiBaseUrl,
} from "@/lib/sessionCookie";

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const response = await fetch(`${getApiBaseUrl()}/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    return redirectToLogin(request);
  }

  if (!response.ok) {
    throw new Error(
      `Gagal memverifikasi sesi pengguna: HTTP ${response.status}`,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/profile/:path*",
};
