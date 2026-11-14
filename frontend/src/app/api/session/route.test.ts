import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { SESSION_COOKIE_NAME } from "@/lib/sessionCookie";

const TOKEN = "token-rahasia-uji";

function loginRequest(): Request {
  return new Request("http://localhost:3000/api/session", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@example.test",
      password: "password-rahasia",
    }),
  });
}

describe("POST /api/session", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("menyimpan token di cookie httpOnly dan tidak mengembalikannya ke client", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: TOKEN,
            token_type: "Bearer",
            user: {
              id: 1,
              name: "Administrator",
              email: "admin@example.test",
              role: "admin",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const response = await POST(loginRequest());
    const body = (await response.json()) as Record<string, unknown>;
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=${TOKEN}`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("path=/");
  });
});
