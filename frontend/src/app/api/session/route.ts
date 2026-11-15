import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getApiBaseUrl,
  getSessionCookieOptions,
  isSameOriginRequest,
} from "@/lib/sessionCookie";

export const dynamic = "force-dynamic";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
};

type BackendError = {
  message?: unknown;
  errors?: unknown;
};

function errorResponse(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    { success: false, message, ...extra },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function extractBackendMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const message = (payload as BackendError).message;

  return typeof message === "string" && message.trim() ? message : fallback;
}

function extractUser(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidate = record.user ?? record.data ?? record;

  return candidate && typeof candidate === "object"
    ? (candidate as Record<string, unknown>)
    : null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return errorResponse("Permintaan tidak valid.", 403);
  }

  let body: LoginPayload;

  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return errorResponse("Format permintaan tidak valid.", 400);
  }

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    !body.email.trim() ||
    !body.password
  ) {
    return errorResponse("Email dan kata sandi wajib diisi.", 422);
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(`${getApiBaseUrl()}/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email.trim(),
        password: body.password,
      }),
      cache: "no-store",
    });
  } catch {
    return errorResponse("Tidak dapat terhubung ke server autentikasi.", 502);
  }

  const payload = (await backendResponse.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!backendResponse.ok) {
    return errorResponse(
      extractBackendMessage(payload, "Email atau kata sandi salah."),
      backendResponse.status,
      { errors: (payload as BackendError | null)?.errors },
    );
  }

  const token = payload?.access_token ?? payload?.token;

  if (
    typeof token !== "string" ||
    !token.trim() ||
    token.length > 4096 ||
    /\s/.test(token)
  ) {
    return errorResponse("Token sesi dari server tidak valid.", 502);
  }

  const response = NextResponse.json(
    {
      success: true,
      user: extractUser(payload),
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  // Token hanya disimpan di cookie httpOnly; response tidak pernah
  // mengembalikan token ke JavaScript di browser.
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return errorResponse("Sesi login tidak ditemukan.", 401);
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(`${getApiBaseUrl()}/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return errorResponse("Tidak dapat terhubung ke server autentikasi.", 502);
  }

  const payload = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const response = errorResponse(
      extractBackendMessage(payload, "Sesi login tidak valid."),
      backendResponse.status,
    );

    if (backendResponse.status === 401 || backendResponse.status === 403) {
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        ...getSessionCookieOptions(),
        maxAge: 0,
      });
    }

    return response;
  }

  return NextResponse.json(
    {
      success: true,
      user: extractUser(payload),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return errorResponse("Permintaan tidak valid.", 403);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    // Cabut token di backend secara best-effort sebelum cookie dihapus.
    try {
      await fetch(`${getApiBaseUrl()}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // Cookie tetap dihapus meskipun backend tidak dapat dihubungi.
    }
  }

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
