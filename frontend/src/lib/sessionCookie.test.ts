import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "./sessionCookie";

function request(
  url: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(url, { method: "POST", headers });
}

describe("isSameOriginRequest", () => {
  it("menerima Origin yang cocok dengan header Host meski request.url berbeda host", () => {
    // next dev melaporkan request.url sebagai localhost meskipun server
    // diakses lewat 127.0.0.1.
    const req = request("http://localhost:3010/api/session", {
      Origin: "http://127.0.0.1:3010",
      Host: "127.0.0.1:3010",
    });

    expect(isSameOriginRequest(req)).toBe(true);
  });

  it("menerima Origin yang cocok dengan X-Forwarded-Host di belakang proxy", () => {
    const req = request("http://app:3000/api/session", {
      Origin: "https://arsip.example.com",
      Host: "app:3000",
      "X-Forwarded-Host": "arsip.example.com",
      "X-Forwarded-Proto": "https",
    });

    expect(isSameOriginRequest(req)).toBe(true);
  });

  it("menolak Origin dengan host berbeda", () => {
    const req = request("http://localhost:3000/api/session", {
      Origin: "https://evil.example",
      Host: "localhost:3000",
    });

    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("menolak Origin dengan protokol berbeda", () => {
    const req = request("http://localhost:3000/api/session", {
      Origin: "https://localhost:3000",
      Host: "localhost:3000",
      "X-Forwarded-Proto": "http",
    });

    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("menolak Origin yang tidak valid", () => {
    const req = request("http://localhost:3000/api/session", {
      Origin: "bukan-url",
      Host: "localhost:3000",
    });

    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("memakai Sec-Fetch-Site saat Origin tidak dikirim", () => {
    expect(
      isSameOriginRequest(
        request("http://localhost:3000/api/session", {
          "Sec-Fetch-Site": "same-origin",
        }),
      ),
    ).toBe(true);

    expect(
      isSameOriginRequest(
        request("http://localhost:3000/api/session", {
          "Sec-Fetch-Site": "cross-site",
        }),
      ),
    ).toBe(false);
  });

  it("fallback ke request.url saat header Host tidak tersedia", () => {
    const req = request("http://localhost:3000/api/session", {
      Origin: "http://localhost:3000",
    });

    expect(isSameOriginRequest(req)).toBe(true);
  });
});
