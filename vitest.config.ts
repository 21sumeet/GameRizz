import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest resolves imports through Vite, which does not read tsconfig `paths`,
 * so the "@/ -> src/" alias has to be repeated here.
 * No DOM: everything tested here is pure math.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});