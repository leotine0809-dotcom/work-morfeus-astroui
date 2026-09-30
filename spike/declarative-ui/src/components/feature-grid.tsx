import { z } from "zod"

import { langTextSchema, pick, useLang } from "../i18n"
import { ICONS, iconNameSchema } from "./feature-icons"

// FeatureGrid — the SECOND marketing/landing-tier component (phase 34 t2), authored in the lab
// (spike/declarative-ui) and NOT yet promoted to @astro/ui. Like the Hero it honors the 6
// non-negotiable rules from CONTEXT.md:
//   1. responsive: fluid widths + max-w + a responsive grid (1 column narrow, up to 3 wide via a
//      @container query), no horizontal overflow at 320/768/1180/1440.
//   2. two DIFFERENT views: a REAL structural reorder of icon-vs-title via a Tailwind v4 @container
//      query — wide places the icon ABOVE the title (a stacked card, flex-col), narrow places the
//      icon to the LEFT of the title on the same row (flex-row items-center). Not merely fewer
//      columns: the icon<->title arrangement itself flips.
//   3. i18n: every text (eyebrow/title/subtitle + each item's title/description) is a { it, en }
//      LangText, resolved through useLang() + pick — the { it, en } object is NEVER rendered
//      directly (no "[object Object]").
//   4. accent configurable: the icon glyph + its tinted surface come only from accent-driven
//      semantic tokens (--accent-ink / --acc-dim / --acc-line, all derived from --acc-h/--acc-c),
//      so turning the accent knob recolors them; the rest is neutral semantic tokens.
//   5. spacing defined: only the named spacing/radius scales (gap-*/p-*/rounded-*), no arbitrary
//      bracket values.
//   6. dark + light: only themed tokens, correct in both modes.
// Each item declares its `icon` as a plain-JSON name validated by iconNameSchema (an owned enum) and
// resolved internally to a real lucide component through ICONS — never raw code, never an SVG string
// through a prop, never dangerouslySetInnerHTML. Icons are DECORATIVE (aria-hidden): the item's
// meaning is carried by the visible title text, never by the icon or colour alone (C9).

export const featureGridPropsSchema = z.object({
  eyebrow: langTextSchema.optional(),
  title: langTextSchema.optional(),
  subtitle: langTextSchema.optional(),
  items: z.array(
    z.object({
      icon: iconNameSchema,
      title: langTextSchema,
      description: langTextSchema,
    }),
  ),
})

export type FeatureGridProps = z.infer<typeof featureGridPropsSchema>

function FeatureGrid({ eyebrow, title, subtitle, items }: FeatureGridProps) {
  const lang = useLang()

  return (
    <section
      data-slot="feature-grid"
      className="@container w-full bg-background text-foreground"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 @3xl:py-24">
        {/* Optional heading block — rendered only when the corresponding field is declared, so a
            grid with no heading fields renders grid-only (C4b). The eyebrow is decorative label
            text (a span, not a heading); the section title is the top heading (h2). */}
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

        {/* The grid — 1 column narrow, up to 3 wide via the @container query (rule 1). */}
        <ul className="grid list-none grid-cols-1 gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon]
            return (
              <li
                key={i}
                data-slot="feature-item"
                // Rule 2 (two DIFFERENT views): narrow = a ROW with the icon to the LEFT of the
                // title (flex-row items-center); wide = a CARD with the icon ABOVE the title
                // (flex-col items-start). A genuine icon<->title reorder at the same @container
                // breakpoint, not just fewer columns.
                className="flex flex-row items-center gap-4 rounded-xl border border-border bg-card p-6 @2xl:flex-col @2xl:items-start @2xl:gap-5"
              >
                <span
                  data-slot="feature-icon"
                  aria-hidden="true"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--acc-dim)] p-3 text-[var(--accent-ink)]"
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3
                    data-slot="feature-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    {pick(item.title, lang)}
                  </h3>
                  <p className="text-pretty leading-relaxed text-muted-foreground">
                    {pick(item.description, lang)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export { FeatureGrid }
