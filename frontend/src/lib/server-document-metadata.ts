import { cookies } from "next/headers";
import { cache } from "react";

const COOKIE_NAME = "document_metadata_token";

type MetadataResponse = {
  data?: {
    document_name?: unknown;
  };
  document_name?: unknown;
};

export type DocumentMetadataLookup =
  | {
      status: "found";
      documentName: string;
    }
  | {
      status: "not-found";
    }
  | {
      status: "unavailable";
    };

/**
 * Membaca metadata dokumen dari backend.
 *
 * Cache React menghindari pengambilan metadata berulang untuk ID yang sama
 * selama proses render server saat generateMetadata dan page sama-sama
 * membutuhkan data dokumen.
 */
export const getDocumentMetadataForRoute = cache(
  async (documentId: string): Promise<DocumentMetadataLookup> => {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value;

      if (!token) {
        return { status: "unavailable" };
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

      if (response.status === 404) {
        return { status: "not-found" };
      }

      // Jangan menyamakan error autentikasi/otorisasi dengan 404.
      if (!response.ok) {
        return { status: "unavailable" };
      }

      const payload = (await response.json()) as MetadataResponse;
      const name = payload.data?.document_name ?? payload.document_name;

      if (typeof name !== "string" || !name.trim()) {
        return { status: "unavailable" };
      }

      return {
        status: "found",
        documentName: name.trim().replace(/\s+/g, " "),
      };
    } catch {
      // Jika API gagal, jangan menyimpulkan bahwa dokumennya tidak ada.
      return { status: "unavailable" };
    }
  },
);

export async function getDocumentNameForMetadata(
  documentId: string,
): Promise<string | null> {
  const result = await getDocumentMetadataForRoute(documentId);

  return result.status === "found" ? result.documentName : null;
}
