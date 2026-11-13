import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "document_metadata_token";

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const apiBaseUrl = (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, "");

  const response = await fetch(`${apiBaseUrl}/me`, {
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
