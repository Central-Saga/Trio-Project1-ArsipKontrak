import { expect, test, type Page } from "@playwright/test";

const SESSION_TOKEN = "e2e-session-token";

async function fillLoginForm(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Alamat Email").fill("admin@example.test");
  await page.getByLabel("Kata Sandi").fill("password-rahasia");
  await page.getByRole("button", { name: "Masuk ke Arsip" }).click();
}

test("login creates an HttpOnly session and opens the dashboard", async ({
  page,
  context,
}) => {
  await page.route("**/api/session", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Set-Cookie": `saga_session=${SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax`,
        },
        body: JSON.stringify({
          success: true,
          user: {
            id: 1,
            name: "Admin E2E",
            email: "admin@example.test",
            role: "admin",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        user: {
          id: 1,
          name: "Admin E2E",
          email: "admin@example.test",
          role: "admin",
        },
      }),
    });
  });

  await page.route("**/api/backend/documents**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    }),
  );
  await page.route("**/api/backend/notifications**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ notifications: [], unread_count: 0 }),
    }),
  );

  await fillLoginForm(page);

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Dashboard Arsip" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(SESSION_TOKEN);

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "saga_session",
  );
  expect(sessionCookie?.httpOnly).toBe(true);
});

test("shows a clear message when the authentication service is unavailable", async ({
  page,
}) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message:
          "Layanan autentikasi sedang tidak tersedia. Silakan coba lagi nanti.",
      }),
    }),
  );

  await fillLoginForm(page);

  await expect(
    page.getByText(
      "Layanan autentikasi sedang tidak tersedia. Silakan coba lagi nanti.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selamat datang kembali" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("keeps the login page usable when the session API returns 500", async ({
  page,
}) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "SQLSTATE[08006]: internal database connection details",
      }),
    }),
  );

  await fillLoginForm(page);

  await expect(
    page.getByText(
      "Layanan autentikasi sedang tidak tersedia. Silakan coba lagi nanti.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Alamat Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Masuk ke Arsip" }),
  ).toBeEnabled();
  await expect(page.locator("body")).not.toContainText("SQLSTATE");
});
