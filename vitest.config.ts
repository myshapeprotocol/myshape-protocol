import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  test: {
    pool: "threads",
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/__benchmark__/**",
        "src/app/**",          // Next.js pages (tested via E2E)
      ],
      // Progressive targets: raise by 5% per sprint until 80%
      // Current baseline: ~29% (engine core well-tested; UI/API covered via E2E)
      thresholds: {
        lines: 25,
        functions: 30,
        branches: 25,
        statements: 25,
      },
    },
  },
});
