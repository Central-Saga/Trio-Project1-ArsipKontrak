import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { SESSION_COOKIE_NAME } from "@/lib/sessionCookie";

const TOKEN = "token-rahasia-proxy";

describe("GET /api/backend/[...path]", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("meneruskan token cookie sebagai Bearer tanpa membocorkannya ke client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: "Administrator" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost:3000/api/backend/me", {
      headers: {
        Accept: "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${TOKEN}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ path: ["me"] }),
    });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const forwardedHeaders = new Headers(init?.headers);
    const body = (await response.json()) as Record<string, unknown>;

    expect(forwardedHeaders.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("menolak request lintas origin untuk metode yang mengubah data", async () => {
    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/backend/documents", {
      method: "POST",
      headers: {
        Origin: "https://evil.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ document_name: "Dokumen" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["documents"] }),
    });

    expect(response.status).toBe(403);
  });
});
