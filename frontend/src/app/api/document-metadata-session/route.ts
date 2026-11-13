import { NextResponse } from "next/server";

const COOKIE_NAME = "document_metadata_token";
const COOKIE_PATHS = ["/documents", "/profile"] as const;

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  return origin === new URL(request.url).origin;
}

function cookieOptions(path: (typeof COOKIE_PATHS)[number]) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path,
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Permintaan tidak valid." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || !("token" in body)) {
    return NextResponse.json(
      { success: false, message: "Token tidak tersedia." },
      { status: 400 },
    );
  }

  const token = (body as { token?: unknown }).token;

  if (
    typeof token !== "string" ||
    !token.trim() ||
    token.length > 4096 ||
    /\s/.test(token)
  ) {
    return NextResponse.json(
      { success: false, message: "Token tidak valid." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  for (const path of COOKIE_PATHS) {
    response.cookies.set(COOKIE_NAME, token, cookieOptions(path));
  }
  response.headers.set("Cache-Control", "no-store");

  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Permintaan tidak valid." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });
  for (const path of COOKIE_PATHS) {
    response.cookies.set(COOKIE_NAME, "", {
      ...cookieOptions(path),
      maxAge: 0,
    });
  }

  response.headers.set("Cache-Control", "no-store");

  return response;
}
