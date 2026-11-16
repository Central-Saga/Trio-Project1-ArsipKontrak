import { expect, test } from "@playwright/test";

const SESSION_TOKEN = "e2e-session-token";

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

  await page.goto("/login");
  await page.getByLabel("Alamat Email").fill("admin@example.test");
  await page.getByLabel("Kata Sandi").fill("password-rahasia");
  await page.getByRole("button", { name: "Masuk ke Arsip" }).click();

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
