// primitives.ts — the shadcn floor (phase 53 t15): `Select*`, `Switch`, `Textarea` copied
// byte-for-byte from astrobot's console/components/ui/{select,switch,textarea}.tsx (only the
// `@/lib/utils` import path changes). A second, separate entry point (PD-6) — it does NOT
// collide with the `Select`/`Switch` composites the main barrel (`./index`) already exports for
// astrocalendar (the native-<select> pill and the token switch).
export * from "./components/ui/select"
export * from "./components/ui/switch"
export * from "./components/ui/textarea"
