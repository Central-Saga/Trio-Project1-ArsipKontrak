const FALLBACK_PATH = "/";

/**
 * Mengembalikan path redirect yang aman untuk navigasi internal.
 *
 * Hanya path relatif same-origin yang diterima. URL absolut, protocol-relative
 * (`//evil.test`), backslash tricks (`/\evil.test`), dan skema seperti
 * `javascript:` akan jatuh ke halaman utama.
 */
export function getSafeRedirectPath(
  value: string | null | undefined,
): string {
  if (!value || value.length > 2048) {
    return FALLBACK_PATH;
  }

  const normalized = value.trim();

  if (
    !normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    normalized.startsWith("/\\")
  ) {
    return FALLBACK_PATH;
  }

  try {
    const decoded = decodeURIComponent(normalized);

    if (decoded.startsWith("//") || decoded.startsWith("/\\")) {
      return FALLBACK_PATH;
    }

    const url = new URL(normalized, "http://localhost");

    if (url.origin !== "http://localhost") {
      return FALLBACK_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return FALLBACK_PATH;
  }
}
