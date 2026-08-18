import { expect, test } from "@playwright/test";

test.describe("authentication smoke tests", () => {
  test("renders the login form and links to registration", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/Đăng nhập.*BugFlow/i);
    await expect(
      page.getByRole("heading", { name: /Đăng nhập BugFlow/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mật khẩu")).toBeVisible();

    await page.getByRole("link", { name: /Tạo tài khoản/i }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(
      page.getByRole("heading", { name: /Tạo tài khoản của bạn/i }),
    ).toBeVisible();
  });

  test("renders the registration form", async ({ page }) => {
    await page.goto("/register");

    await expect(page).toHaveTitle(/Tạo tài khoản.*BugFlow/i);
    await expect(page.getByLabel("Họ và tên")).toBeVisible();
    await expect(page.getByLabel("Tên người dùng")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mật khẩu")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Tạo tài khoản/i }),
    ).toBeVisible();
  });

  test("redirects anonymous users away from protected pages", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    const callbackUrl = new URL(page.url()).searchParams.get("callbackUrl");
    expect(callbackUrl).toBeTruthy();
    expect(new URL(callbackUrl!).pathname).toBe("/dashboard");
  });
});
