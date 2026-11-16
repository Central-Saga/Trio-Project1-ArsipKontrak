import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "./sessionCookie";

const SOURCE_ROOT = join(process.cwd(), "src");
const STORAGE_API = ["local", "Storage"].join("");

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectSourceFiles(path);
    }

    if (
      !/\.(ts|tsx)$/.test(entry) ||
      /\.test\.(ts|tsx)$/.test(entry) ||
      entry === "setup.ts"
    ) {
      return [];
    }

    return [path];
  });
}

describe("penyimpanan sesi", () => {
  it("menyimpan token di cookie httpOnly dengan path seluruh aplikasi", () => {
    const options = getSessionCookieOptions();

    expect(SESSION_COOKIE_NAME.length).toBeGreaterThan(0);
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("lax");
  });

  it("tidak membaca atau menulis token/pengguna ke localStorage", () => {
    const forbidden = new RegExp(
      `${STORAGE_API}\\.(?:getItem|setItem)\\([^)]*(?:token|auth_token|user_data|"user")`,
      "i",
    );

    const offenders = collectSourceFiles(SOURCE_ROOT).filter((file) =>
      forbidden.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
