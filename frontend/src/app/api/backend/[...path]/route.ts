import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getApiBaseUrl,
  isSameOriginRequest,
} from "@/lib/sessionCookie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "idempotency-key",
  "if-modified-since",
  "if-none-match",
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "cache-control",
  "etag",
  "last-modified",
  "retry-after",
] as const;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Proxy same-origin ke API Laravel.
 *
 * Token sesi dibaca dari cookie httpOnly di server Next.js dan diteruskan
 * sebagai header Authorization. Browser tidak pernah menerima token tersebut.
 */
async function handle(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const method = request.method.toUpperCase();

  if (!SAFE_METHODS.has(method) && !isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, message: "Permintaan tidak valid." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { path } = await context.params;
  const target = new URL(
    `${getApiBaseUrl()}/${path.map((segment) => encodeURIComponent(segment)).join("/")}`,
  );

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  let body: ArrayBuffer | undefined;

  if (!SAFE_METHODS.has(method)) {
    body = await request.arrayBuffer();
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server API." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const responseHeaders = new Headers();

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(name);

    if (value && name !== "cache-control") {
      responseHeaders.set(name, value);
    }
  }

  // Data autentikasi tidak boleh disimpan di cache browser/proxy.
  responseHeaders.set("Cache-Control", "no-store");

  return new NextResponse(
    method === "HEAD" ? null : backendResponse.body,
    {
      status: backendResponse.status,
      headers: responseHeaders,
    },
  );
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
