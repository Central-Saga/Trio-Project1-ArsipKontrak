import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, POST } from "./route";
import { SESSION_COOKIE_NAME } from "@/lib/sessionCookie";
import { AUTH_SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/sessionMessages";

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

function sessionRequest(
  method: string,
  options: { body?: string; origin?: string; cookie?: string } = {},
): NextRequest {
  const headers = new Headers();

  if (options.origin !== undefined) {
    headers.set("Origin", options.origin);
  } else {
    headers.set("Origin", "http://localhost:3000");
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.cookie) {
    headers.set("Cookie", options.cookie);
  }

  return new NextRequest("http://localhost:3000/api/session", {
    method,
    headers,
    body: options.body,
  });
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
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

  it("rejects cross-origin and malformed login requests", async () => {
    const crossOrigin = await POST(
      sessionRequest("POST", {
        origin: "https://evil.example",
        body: JSON.stringify({ email: "a@example.test", password: "pass" }),
      }),
    );
    const malformed = await POST(
      sessionRequest("POST", { body: "{" }),
    );
    const invalidPayload = await POST(
      sessionRequest("POST", {
        body: JSON.stringify({ email: " ", password: "" }),
      }),
    );

    expect(crossOrigin.status).toBe(403);
    expect(malformed.status).toBe(400);
    expect(invalidPayload.status).toBe(422);
  });

  it("forwards backend errors and rejects an invalid backend token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "Akun tidak aktif." }, 403))
      .mockResolvedValueOnce(jsonResponse({ user: { id: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const backendError = await POST(loginRequest());
    const invalidToken = await POST(loginRequest());

    expect(backendError.status).toBe(403);
    await expect(backendError.json()).resolves.toMatchObject({
      message: "Akun tidak aktif.",
    });
    expect(invalidToken.status).toBe(502);
  });

  it("returns a gateway error when the authentication server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await POST(loginRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      message: AUTH_SERVICE_UNAVAILABLE_MESSAGE,
    });
  });

  it("hides backend details when login returns not found or server errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ message: "Internal database details" }, 500),
        )
        .mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404)),
    );

    const serverError = await POST(loginRequest());
    const notFound = await POST(loginRequest());

    for (const response of [serverError, notFound]) {
      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toMatchObject({
        message: AUTH_SERVICE_UNAVAILABLE_MESSAGE,
      });
    }
  });
});

describe("GET /api/session", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires a cookie and returns the current user for a valid session", async () => {
    const missingCookie = await GET(
      sessionRequest("GET"),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ data: { id: 1, name: "Admin", email: "a@example.test" } }),
      ),
    );
    const validSession = await GET(
      sessionRequest("GET", {
        cookie: `${SESSION_COOKIE_NAME}=${TOKEN}`,
      }),
    );

    expect(missingCookie.status).toBe(401);
    await expect(validSession.json()).resolves.toMatchObject({
      user: { id: 1, name: "Admin" },
    });
  });

  it("clears unauthorized sessions and handles backend failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
        .mockRejectedValueOnce(new Error("offline")),
    );
    const request = sessionRequest("GET", {
      cookie: `${SESSION_COOKIE_NAME}=${TOKEN}`,
    });

    const unauthorized = await GET(request);
    const unavailable = await GET(request);

    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(unavailable.status).toBe(502);
  });
});

describe("DELETE /api/session", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects cross-origin logout and clears the cookie after revocation", async () => {
    const crossOrigin = await DELETE(
      sessionRequest("DELETE", { origin: "https://evil.example" }),
    );
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await DELETE(
      sessionRequest("DELETE", {
        cookie: `${SESSION_COOKIE_NAME}=${TOKEN}`,
      }),
    );

    expect(crossOrigin.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("still clears the cookie if backend logout fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await DELETE(
      sessionRequest("DELETE", {
        cookie: `${SESSION_COOKIE_NAME}=${TOKEN}`,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
