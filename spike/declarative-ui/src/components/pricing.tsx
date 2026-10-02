import * as React from "react"
import { z } from "zod"

import { cn } from "@astro/ui"
import { langTextSchema, pick, useLang, type LangText } from "../i18n"
import { ICONS } from "./feature-icons"

// Pricing — the THIRD marketing/landing-tier component (phase 35 t1), and the FIRST INTERACTIVE
// one (it holds local UI state: the monthly/annual billing toggle). Authored in the lab
// (spike/declarative-ui) and NOT yet promoted to @astro/ui. It honors the 6 non-negotiable rules
// from CONTEXT.md:
//   1. responsive: fluid widths + max-w + a flex layout (1 column narrow, up to 3 wide via a
//      @container query), no horizontal overflow at 320/768/1180/1440 in BOTH billing states.
//   2. two DIFFERENT views: a REAL structural reorder of the highlighted plan via a Tailwind v4
//      @container query. The highlighted plan is DECLARED as a non-first (center) plan; narrow
//      pulls it to the TOP of the stack (order-first), wide resets order (@3xl:order-none) so it
//      sits in its natural CENTER position, lifted/scaled above its flanking siblings. Not merely
//      fewer columns: the highlighted plan's order index vs its siblings genuinely flips.
//   3. i18n: every text (heading eyebrow/title/subtitle, each plan name/description/features/cta/
//      badge, and the billing period + note labels) is a { it, en } LangText, resolved through
//      useLang() + pick — the { it, en } object is NEVER rendered directly. Prices are plain
//      currency strings (a number/currency is not translated prose).
//   4. accent configurable: the highlighted plan's border/badge/filled CTA come only from
//      accent-driven semantic tokens (--primary / --primary-foreground / --accent-ink), so turning
//      the accent knob recolors them; non-highlighted plans keep a neutral outline treatment.
//   5. spacing defined: only the named spacing/radius scales (gap-*/p-*/rounded-*), no arbitrary
//      bracket values.
//   6. dark + light: only themed tokens, correct in both modes.
// The per-feature check glyph comes from the owned ICONS["check"] map (never raw code/SVG through a
// prop) and is DECORATIVE (aria-hidden): meaning is carried by the visible feature text. The
// billing toggle is a REAL accessible segmented control (a group with an accessible name, two
// options reflecting aria-pressed, natively keyboard operable, with a visible focus-visible ring).

const billingLabelsSchema = z
  .object({
    monthlyLabel: langTextSchema.optional(),
    annualLabel: langTextSchema.optional(),
    perMonth: langTextSchema.optional(),
    perYear: langTextSchema.optional(),
    annualNote: langTextSchema.optional(),
    groupLabel: langTextSchema.optional(),
  })
  .optional()

const planSchema = z.object({
  name: langTextSchema,
  priceMonthly: z.string(),
  priceAnnual: z.string(),
  description: langTextSchema.optional(),
  features: z.array(langTextSchema),
  cta: z.object({
    label: langTextSchema,
    href: z.string(),
  }),
  highlighted: z.boolean().optional(),
  badge: langTextSchema.optional(),
})

export const pricingPropsSchema = z
  .object({
    eyebrow: langTextSchema.optional(),
    title: langTextSchema.optional(),
    subtitle: langTextSchema.optional(),
    billing: billingLabelsSchema,
    defaultBilling: z.enum(["monthly", "annual"]).optional(),
    plans: z.array(planSchema),
  })
  // Anatomy guarantee (C4): EXACTLY ONE recommended plan. A runtime-only guard — z.toJSONSchema
  // serializes the refined object as its base object schema, so the generated contract (t2) is
  // unaffected. The message MUST contain the word "highlighted" (asserted by the C4 test).
  .superRefine((val, ctx) => {
    const count = val.plans.filter((p) => p.highlighted).length
    if (count !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["plans"],
        message: `plans must contain exactly one highlighted plan (got ${count})`,
      })
    }
  })

export type PricingProps = z.infer<typeof pricingPropsSchema>

type Billing = "monthly" | "annual"

// Bilingual built-in labels: used when the corresponding billing field is omitted, so every label
// still swaps with the language toggle (C7) and is never a single-language literal.
const DEFAULT_BILLING_LABELS = {
  monthlyLabel: { it: "Mensile", en: "Monthly" },
  annualLabel: { it: "Annuale", en: "Annual" },
  perMonth: { it: "/mese", en: "/month" },
  perYear: { it: "/anno", en: "/year" },
  annualNote: { it: "Risparmia con l'annuale", en: "Save with annual billing" },
  groupLabel: { it: "Ciclo di fatturazione", en: "Billing cycle" },
} satisfies Record<string, LangText>

// Shared focus-visible treatment (reuses the Hero ctaFocus ring pattern): a visible accent ring
// offset from the background, in both themes (WCAG 2.2 focus-visible).
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

const Check = ICONS["check"]

function Pricing({ eyebrow, title, subtitle, billing, defaultBilling, plans }: PricingProps) {
  const lang = useLang()
  const [cycle, setCycle] = React.useState<Billing>(defaultBilling ?? "monthly")

  const monthlyLabel = billing?.monthlyLabel ?? DEFAULT_BILLING_LABELS.monthlyLabel
  const annualLabel = billing?.annualLabel ?? DEFAULT_BILLING_LABELS.annualLabel
  const perMonth = billing?.perMonth ?? DEFAULT_BILLING_LABELS.perMonth
  const perYear = billing?.perYear ?? DEFAULT_BILLING_LABELS.perYear
  const annualNote = billing?.annualNote ?? DEFAULT_BILLING_LABELS.annualNote
  const groupLabel = billing?.groupLabel ?? DEFAULT_BILLING_LABELS.groupLabel

  const isAnnual = cycle === "annual"
  const periodLabel = isAnnual ? perYear : perMonth

  const optionBase =
    "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"

  return (
    <section
      data-slot="pricing"
      className="@container w-full bg-background text-foreground"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 @3xl:py-24">
        {/* Optional heading block — rendered only when a field is declared (C4b). */}
        {(eyebrow || title || subtitle) && (
          <div className="flex max-w-2xl flex-col items-start gap-4">
            {eyebrow && (
              <span className="inline-flex w-fit items-center rounded-full border border-[var(--acc-line)] bg-[var(--acc-dim)] px-3 py-1 text-sm font-semibold text-[var(--accent-ink)]">
                {pick(eyebrow, lang)}
              </span>
            )}
            {title && (
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground @3xl:text-4xl">
                {pick(title, lang)}
              </h2>
            )}
            {subtitle && (
              <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {pick(subtitle, lang)}
              </p>
            )}
          </div>
        )}

        {/* Billing toggle — a REAL accessible segmented control (C5/C6). role=group + an accessible
            name; each option is a native <button> (Tab + Space/Enter operable) reflecting its state
            via aria-pressed; a visible focus-visible ring. Switching it swaps EVERY plan's price. */}
        <div className="flex flex-col items-start gap-2">
          <div
            data-slot="billing-toggle"
            role="group"
            aria-label={pick(groupLabel, lang)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
          >
            <button
              type="button"
              aria-pressed={!isAnnual}
              onClick={() => setCycle("monthly")}
              className={cn(
                optionBase,
                focusRing,
                isAnnual
                  ? "text-muted-foreground hover:text-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {pick(monthlyLabel, lang)}
            </button>
            <button
              type="button"
              aria-pressed={isAnnual}
              onClick={() => setCycle("annual")}
              className={cn(
                optionBase,
                focusRing,
                isAnnual
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {pick(annualLabel, lang)}
            </button>
          </div>
          {isAnnual && (
            <p className="text-sm font-medium text-[var(--accent-ink)]">{pick(annualNote, lang)}</p>
          )}
        </div>

        {/* Plans — narrow: a flex-col stack; wide: a flex-row of up to 3 equal columns (rule 1).
            Rule 2 reorder lives on the highlighted plan below. */}
        <div className="flex flex-col items-stretch gap-6 @3xl:flex-row @3xl:items-center">
          {plans.map((plan, i) => {
            const highlighted = plan.highlighted === true
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
            return (
              <div
                key={i}
                data-slot={highlighted ? "plan-highlighted" : "plan"}
                className={cn(
                  "flex flex-1 flex-col gap-6 rounded-2xl border bg-card p-6",
                  highlighted
                    ? // Rule 2: DECLARED as a non-first (center) plan, but pulled to the TOP on
                      // narrow (order-first) and reset on wide (@3xl:order-none) where it lifts +
                      // scales above its flanking siblings. Accent border marks it as recommended.
                      "order-first border-primary shadow-sm @3xl:order-none @3xl:-translate-y-4 @3xl:scale-105"
                    : "border-border",
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{pick(plan.name, lang)}</h3>
                    {highlighted && plan.badge && (
                      <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {pick(plan.badge, lang)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      data-slot="plan-price"
                      className="text-3xl font-semibold tracking-tight text-foreground"
                    >
                      {price}
                    </span>
                    <span className="text-sm text-muted-foreground">{pick(periodLabel, lang)}</span>
                  </div>
                  {plan.description && (
                    <p className="text-pretty leading-relaxed text-muted-foreground">
                      {pick(plan.description, lang)}
                    </p>
                  )}
                </div>

                <ul className="flex list-none flex-col gap-3">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 inline-flex shrink-0 items-center justify-center text-[var(--accent-ink)]"
                      >
                        <Check className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-pretty leading-relaxed text-foreground">
                        {pick(feature, lang)}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.cta.href}
                  className={cn(
                    "mt-auto inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity",
                    focusRing,
                    highlighted
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border text-foreground transition-colors hover:bg-accent",
                  )}
                >
                  {pick(plan.cta.label, lang)}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { Pricing }
