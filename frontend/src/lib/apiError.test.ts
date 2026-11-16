import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import api from "./api";
import { getApiErrorMessage } from "./apiError";
import { server } from "../test/msw/server";

describe("API error handling with MSW", () => {
  it("uses the first Laravel validation error from a mocked API response", async () => {
    server.use(
      http.get("*/api/backend/documents", () =>
        HttpResponse.json(
          {
            success: false,
            errors: {
              document_name: ["Nama dokumen wajib diisi."],
            },
          },
          { status: 422 },
        ),
      ),
    );

    let requestError: unknown;

    try {
      await api.get("/documents");
    } catch (error: unknown) {
      requestError = error;
    }

    expect(getApiErrorMessage(requestError, "Request gagal.")).toBe(
      "Nama dokumen wajib diisi.",
    );
  });

  it("returns a useful fallback for non-Axios errors", () => {
    expect(getApiErrorMessage(new Error("offline"), "Request gagal.")).toBe(
      "offline",
    );
    expect(getApiErrorMessage(null, "Request gagal.")).toBe("Request gagal.");
  });
});
