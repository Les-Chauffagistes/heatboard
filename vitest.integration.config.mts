import { defineConfig } from "vitest/config";
import path from "node:path";

/** Tests d'intégration : vraie Postgres via testcontainers (Docker requis). */
export default defineConfig({
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
    test: {
        include: ["src/**/*.int.test.ts"],
        globalSetup: ["./tests/integration/globalSetup.ts"],
        testTimeout: 30_000,
        hookTimeout: 120_000,
        fileParallelism: false,
    },
});
