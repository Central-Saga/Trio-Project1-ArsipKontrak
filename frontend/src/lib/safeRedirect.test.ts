import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "./safeRedirect";

describe("getSafeRedirectPath", () => {
  it.each([
    "https://evil.example/login",
    "http://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/%5Cevil.example",
    "   ",
    null,
    undefined,
  ])("menolak redirect tidak aman: %s", (value) => {
    expect(getSafeRedirectPath(value)).toBe("/");
  });

  it("mempertahankan path internal beserta query dan hash", () => {
    expect(getSafeRedirectPath("/documents/12?tab=versi#terbaru")).toBe(
      "/documents/12?tab=versi#terbaru",
    );
  });

  it("menerima path internal sederhana", () => {
    expect(getSafeRedirectPath("/profile")).toBe("/profile");
  });
});
