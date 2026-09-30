import { defineConfig } from "tsup"

// @astro/ui build — ESM + type declarations. React/react-dom are peers (the consumer provides them);
// everything else (Radix, sonner, lucide, clsx, tailwind-merge, zod) is bundled/marked as a dep.
// styles.css + tokens.css are copied to dist by the package `build` script (tsup emits JS/DTS only).
// Three entries (PD-6): `src/index.ts` (components), `src/tokens/index.ts` (the pure half — no
// React, safe to `import` from a Node check script) → `dist/index.js` and `dist/tokens/index.js`,
// and `src/primitives.ts` (t15: the shadcn floor — Select/Switch/Textarea) → `dist/primitives.js`.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "tokens/index": "src/tokens/index.ts",
    primitives: "src/primitives.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
})
