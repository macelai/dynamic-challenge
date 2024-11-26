import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    setupFiles: ["src/test-utils/setup.ts"],
    env: require('dotenv').config({ path: ".env.test" }).parsed,
    sequence: {
      hooks: 'list',
      setupFiles: 'list'
    },
    fileParallelism: false,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
