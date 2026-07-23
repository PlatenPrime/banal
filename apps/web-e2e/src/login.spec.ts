import { expect, test } from '@playwright/test';

const username = process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'e2e-admin';
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'e2e-admin-password1';

test('login reaches protected new-example page', async ({ page }) => {
  await page.goto('/login?redirect=/examples/new');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/examples\/new/);
  await expect(page.getByRole('heading', { name: 'New example' })).toBeVisible();
});
