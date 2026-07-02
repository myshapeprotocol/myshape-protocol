import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  test: {
    pool: "forks",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
