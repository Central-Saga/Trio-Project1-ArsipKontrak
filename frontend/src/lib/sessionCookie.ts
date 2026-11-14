export const SESSION_COOKIE_NAME = "saga_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Alamat API backend yang dipakai route handler server-side.
 *
 * Nilai ini tidak pernah dikirim ke browser. Di Docker Compose, alamat diisi
 * dengan nama service internal (http://app:8000/api/v1).
 */
export function getApiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, "");
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();

  return first ? first : null;
}

/**
 * Host yang dilihat browser.
 *
 * `request.url` di Next.js dapat berisi host internal (misalnya saat dev
 * server diakses lewat 127.0.0.1 tetapi URL-nya localhost). Header Host atau
 * X-Forwarded-Host lebih akurat untuk membandingkan Origin.
 */
function getRequestHost(request: Request): string | null {
  return (
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host"))
  );
}

function getRequestProtocol(request: Request): string | null {
  const forwarded = firstHeaderValue(
    request.headers.get("x-forwarded-proto"),
  );

  if (forwarded) {
    return `${forwarded.toLowerCase()}:`;
  }

  try {
    return new URL(request.url).protocol;
  } catch {
    return null;
  }
}

/**
 * Tolak request lintas origin untuk operasi yang mengubah state.
 *
 * Cookie sesi memakai SameSite=Lax, tetapi pemeriksaan Origin tetap dilakukan
 * sebagai lapisan pertahanan tambahan terhadap CSRF.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    // Browser modern mengirim Sec-Fetch-Site untuk request same-origin.
    const fetchSite = request.headers.get("sec-fetch-site");

    return fetchSite === "same-origin" || fetchSite === "none";
  }

  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  const host = getRequestHost(request);

  if (host) {
    if (parsedOrigin.host !== host) {
      return false;
    }

    const protocol = getRequestProtocol(request);

    return protocol === null || parsedOrigin.protocol === protocol;
  }

  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
