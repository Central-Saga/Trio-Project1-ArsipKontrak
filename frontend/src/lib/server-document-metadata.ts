import { cookies } from "next/headers";

const COOKIE_NAME = "document_metadata_token";

type MetadataResponse = {
  data?: {
    document_name?: unknown;
  };
  document_name?: unknown;
};

export async function getDocumentNameForMetadata(
  documentId: string,
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const apiBaseUrl = (
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:8000/api/v1"
    ).replace(/\/+$/, "");

    const endpoint =
      `${apiBaseUrl}/documents/${encodeURIComponent(documentId)}/metadata`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as MetadataResponse;
    const name = payload.data?.document_name ?? payload.document_name;

    if (typeof name !== "string" || !name.trim()) {
      return null;
    }

    return name.trim().replace(/\s+/g, " ");
  } catch {
    // Jika tidak ada sesi atau API tidak tersedia,
    // halaman tetap bisa menggunakan judul cadangan berdasarkan ID.
    return null;
  }
}
