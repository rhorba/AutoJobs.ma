import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "https://auto-jobs-ma.vercel.app",
    video: "on",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "test-results/html-report" }],
  ],
  outputDir: "test-results/artifacts",
});
