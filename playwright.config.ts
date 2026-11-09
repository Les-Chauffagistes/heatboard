import { defineConfig, devices } from "@playwright/test";

const APP_URL = "http://localhost:3102";

export default defineConfig({
    testDir: "tests/e2e",
    testMatch: "**/*.spec.ts",
    // Une seule base partagée : les tests se réinitialisent mutuellement, donc exécution séquentielle.
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    use: { baseURL: APP_URL, trace: "retain-on-failure", locale: "fr-FR" },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "node tests/e2e/stack.mjs",
        url: `${APP_URL}/api/health`,
        timeout: 180_000,
        reuseExistingServer: false,
        stdout: "pipe",
    },
});
