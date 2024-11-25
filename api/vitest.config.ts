import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    setupFiles: ["src/test-utils/setup.ts"],
    env: process.env.CI
      ? require('dotenv').config({ path: ".env.ci" }).parsed
      : require('dotenv').config({ path: ".env.test" }).parsed,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
