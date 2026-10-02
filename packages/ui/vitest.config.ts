import { defineConfig } from "vitest/config"

// @astro/ui's test runner (t1, phase 53 — the package had none before). `node` environment: the
// component tests use `renderToStaticMarkup` (no DOM needed); the tokens tests are plain
// file/string assertions.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
