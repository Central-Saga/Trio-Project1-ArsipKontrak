import { cookies } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { SESSION_COOKIE_NAME, getApiBaseUrl } from "@/lib/sessionCookie";

const MetadataResponseSchema = z.object({
  data: z
    .object({
      document_name: z.unknown().optional(),
    })
    .optional(),
  document_name: z.unknown().optional(),
});

type MetadataResponse = z.infer<typeof MetadataResponseSchema>;

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
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

      if (!token) {
        return { status: "unavailable" };
      }

      const endpoint =
        `${getApiBaseUrl()}/documents/${encodeURIComponent(documentId)}/metadata`;

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

      const rawJson = await response.json();
      const parsed = MetadataResponseSchema.safeParse(rawJson);

      if (!parsed.success) {
        return { status: "unavailable" };
      }

      const payload = parsed.data;
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
