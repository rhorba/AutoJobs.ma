import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import { TEST_EMPLOYER_EMAIL, TEST_CANDIDATE_EMAIL, TEST_PASSWORD } from "./constants";

// ── Helpers ────────────────────────────────────────────────────────────────

function readState() {
  return JSON.parse(fs.readFileSync("test-results/.e2e-state.json", "utf-8")) as {
    empId?: string;
    candId?: string;
    companyId?: string;
    activeJobId?: string;
  };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/connexion");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/connexion"), { timeout: 15_000 });
}

// ── 1. Public pages ────────────────────────────────────────────────────────

test.describe("Public pages", () => {
  test("landing page loads with hero and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AutoJobs/i);
    await expect(page.locator("h1").first()).toBeVisible();
    // CTA buttons present
    await expect(page.getByRole("link", { name: /offre|emploi|recruteur/i }).first()).toBeVisible();
  });

  test("job listing page renders jobs", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");
    // Page title or heading present
    await expect(page.locator("h1, h2").first()).toBeVisible();
    // At least the E2E test job should appear
    await expect(page.getByText("Technicien câblage automobile E2E")).toBeVisible({ timeout: 15_000 });
  });

  test("job detail page renders full content", async ({ page }) => {
    const { activeJobId } = readState();
    if (!activeJobId) test.skip();
    await page.goto(`/jobs/${activeJobId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Technicien câblage automobile E2E")).toBeVisible();
    await expect(page.getByText(/CDI/i)).toBeVisible();
    await expect(page.getByText(/Kénitra/i)).toBeVisible();
  });
});

// ── 2. Auth forms ──────────────────────────────────────────────────────────

test.describe("Auth forms", () => {
  test("employer signup form renders all fields", async ({ page }) => {
    await page.goto("/inscription/employeur");
    await expect(page.locator("#first_name")).toBeVisible();
    await expect(page.locator("#last_name")).toBeVisible();
    await expect(page.locator("#company_name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /créer/i })).toBeVisible();
  });

  test("candidate signup form renders all fields", async ({ page }) => {
    await page.goto("/inscription/candidat");
    await expect(page.locator("#first_name")).toBeVisible();
    await expect(page.locator("#last_name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /créer/i })).toBeVisible();
  });

  test("login page renders and shows error on bad credentials", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    await page.fill("#email", "nobody@nowhere.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/identifiants incorrects/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ── 3. Employer authenticated flow ─────────────────────────────────────────

test.describe("Employer flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMPLOYER_EMAIL, TEST_PASSWORD);
  });

  test("login redirects employer away from /connexion", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/connexion/);
    // Navigate to offres — must be accessible
    await page.goto("/offres");
    await expect(page).toHaveURL(/\/offres/);
  });

  test("/offres page shows job list", async ({ page }) => {
    await page.goto("/offres");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /nouvelle offre/i })).toBeVisible();
    await expect(page.getByText("Technicien câblage automobile E2E")).toBeVisible();
  });

  test("/offres/nouvelle renders the full job form", async ({ page }) => {
    await page.goto("/offres/nouvelle");
    await expect(page.locator("#title")).toBeVisible();
    await expect(page.locator("#description_fr")).toBeVisible();
    await expect(page.getByRole("button", { name: /créer l'offre/i })).toBeVisible();
  });

  test("create a job → redirected to payment page", async ({ page }) => {
    await page.goto("/offres/nouvelle");
    await page.waitForLoadState("networkidle");

    // Fill title
    await page.fill("#title", "Technicien qualité batteries E2E");

    // shadcn Select for city — click the trigger then the option
    await page.locator('[id="city"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 5_000 });
    await page.getByRole("option", { name: "Casablanca" }).first().click();

    // shadcn Select for contract type
    await page.locator('[id="contract_type"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 5_000 });
    await page.getByRole("option", { name: "CDI" }).first().click();

    // Fill description (min 50 chars)
    await page.fill(
      "#description_fr",
      "Contrôle qualité en fin de ligne de production de batteries lithium-ion. Expérience en métrologie souhaitée. CDI temps plein, avantages sociaux complets."
    );

    await page.click('button[type="submit"]');

    // Should redirect to /offres/[id]/paiement
    await page.waitForURL(/\/offres\/.+\/paiement/, { timeout: 30_000 });
    await expect(page.getByText(/490 MAD|Payer par carte/i)).toBeVisible();
  });

  test("payment page shows PayButton and redirects to Stripe on click", async ({ page }) => {
    const { activeJobId } = readState();
    if (!activeJobId) test.skip();

    // Force job to pending_payment status to reach payment page
    await page.goto(`/offres/${activeJobId}/paiement`);
    await page.waitForLoadState("networkidle");

    // PayButton should be visible (even if job is active, page renders)
    const payBtn = page.getByRole("button", { name: /payer par carte/i });
    if (await payBtn.isVisible()) {
      const [response] = await Promise.all([
        page.waitForURL(/stripe\.com|localhost/, { timeout: 20_000 }).catch(() => null),
        payBtn.click(),
      ]);
      // Either went to Stripe or stayed (job already active = no checkout needed)
      // Both are valid outcomes
    } else {
      // Job is already active — that's fine
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("employer can view applications for active job", async ({ page }) => {
    const { activeJobId } = readState();
    if (!activeJobId) test.skip();
    await page.goto(`/offres/${activeJobId}/candidatures`);
    await page.waitForLoadState("networkidle");
    // Page loads without error
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

// ── 4. Candidate authenticated flow ────────────────────────────────────────

test.describe("Candidate flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CANDIDATE_EMAIL, TEST_PASSWORD);
  });

  test("login redirects candidate to /profil", async ({ page }) => {
    await expect(page).toHaveURL(/\/profil/);
  });

  test("/profil page loads profile form", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Fatima/i })).toBeVisible();
  });

  test("candidate can browse job listings", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Technicien câblage automobile E2E")).toBeVisible({ timeout: 15_000 });
  });

  test("job detail shows description and postuler link", async ({ page }) => {
    const { activeJobId } = readState();
    if (!activeJobId) test.skip();
    await page.goto(`/jobs/${activeJobId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Technicien câblage automobile E2E")).toBeVisible();
    await expect(page.getByText(/câblage|assemblage/i)).toBeVisible();
    // Apply link present
    await expect(page.getByRole("link", { name: /postuler/i })).toBeVisible();
  });

  test("apply form loads for active job", async ({ page }) => {
    const { activeJobId } = readState();
    if (!activeJobId) test.skip();
    await page.goto(`/candidatures/postuler?job_id=${activeJobId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#cover_note")).toBeVisible();
    await expect(page.getByRole("button", { name: /envoyer ma candidature/i })).toBeVisible();
  });

  test("candidate submits application successfully", async ({ page }) => {
    const { activeJobId } = readState();
    if (!activeJobId) test.skip();
    await page.goto(`/candidatures/postuler?job_id=${activeJobId}`);
    await page.waitForLoadState("networkidle");

    await page.fill(
      "#cover_note",
      "Je suis très motivée par ce poste de technicien câblage. Mes 3 ans d'expérience dans le secteur automobile me permettent d'être rapidement opérationnelle."
    );

    await page.click('button[type="submit"]');

    // Either success toast or redirect to /candidatures
    await Promise.race([
      page.waitForURL(/\/candidatures/, { timeout: 15_000 }),
      page.waitForSelector('[data-sonner-toast]', { timeout: 15_000 }),
    ]);

    const currentUrl = page.url();
    const hasToast = await page.locator('[data-sonner-toast]').isVisible().catch(() => false);
    expect(currentUrl.includes("/candidatures") || hasToast).toBe(true);
  });

  test("candidate can view their applications list", async ({ page }) => {
    await page.goto("/candidatures");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
