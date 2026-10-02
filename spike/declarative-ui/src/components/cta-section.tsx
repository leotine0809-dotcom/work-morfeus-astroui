import { z } from "zod"

import { cn } from "@astro/ui"
import { langTextSchema, pick, useLang } from "../i18n"

// CTASection — the FIFTH marketing/landing-tier component (phase 37 t1), the closing call-to-action
// band, authored in the lab (spike/declarative-ui) and NOT yet promoted to @astro/ui. It mirrors
// the Hero (33) CTA/anatomy shape and the Pricing (35) @container two-view, and honors the 6
// non-negotiable rules from CONTEXT.md:
//   1. responsive: fluid widths + max-w + wrapping, no horizontal overflow at 320/768/1180/1440,
//      including the narrow full-width CTAs.
//   2. two DIFFERENT views: a real structural reorder via a Tailwind v4 @container query — wide
//      places the text (title/subtitle) on the LEFT and the CTAs on the RIGHT, side by side; narrow
//      STACKS everything, CENTERED, with the CTAs below and full-width. Not one stack scaled.
//   3. i18n: every text prop (eyebrow/title/subtitle + each CTA label) is a { it, en } LangText,
//      resolved through useLang() + pick — the { it, en } object is NEVER rendered directly.
//   4. accent configurable: the whole band is accent-driven (bg-primary + text-primary-foreground),
//      and the CTAs recolor with the accent knob, so changing the accent recolors the section.
//   5. spacing defined: only the named spacing/radius scales (gap-*/p-*/rounded-*), no arbitrary values.
//   6. dark + light: only themed tokens, correct in both modes.
// The band is itself the accent surface, so the normal Hero/Pricing CTA + focus recipe is INVERTED
// so it reads ON the band: the primaryCta is a bg-primary-foreground chip with text-primary label
// (its accent-tracking channel is the TEXT), the secondaryCta is a ghost/outline in the on-band
// foreground, and the focus-visible ring is in the on-band foreground offset to the band colour.
// There is NO media/icon slot and no prop carries raw code/HTML — every prop is { it, en } text or a
// plain href string, so nothing renders through dangerouslySetInnerHTML.

export const ctaSectionPropsSchema = z.object({
  eyebrow: langTextSchema.optional(),
  title: langTextSchema,
  subtitle: langTextSchema.optional(),
  primaryCta: z.object({
    label: langTextSchema,
    href: z.string(),
  }),
  secondaryCta: z
    .object({
      label: langTextSchema,
      href: z.string(),
    })
    .optional(),
})

export type CtaSectionProps = z.infer<typeof ctaSectionPropsSchema>

// Shared CTA base: a link-shaped button, keyboard operable, full-width on narrow, natural on wide.
const ctaBase =
  "inline-flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold @3xl:w-auto"

// The focus-visible ring must READ on the accent band, so it is the on-band foreground colour offset
// to the band colour (NOT the neutral ring/background used off-band). WCAG 2.2 focus-visible.
const ctaFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"

function CTASection({ eyebrow, title, subtitle, primaryCta, secondaryCta }: CtaSectionProps) {
  const lang = useLang()

  return (
    <section className="w-full bg-background px-6 py-16 @3xl:py-24">
      <div className="mx-auto w-full max-w-6xl">
        {/* The accent band IS the @container, so a fixed-width preview frame triggers the two-view
            (rule 2). C5 reads THIS element's computed bg (var(--primary)) + text-primary-foreground. */}
        <div
          data-slot="cta"
          className="@container rounded-3xl bg-primary p-8 text-primary-foreground @3xl:p-12"
        >
          <div className="flex flex-col items-center gap-8 text-center @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:text-left">
            {/* TEXT block — first in the DOM, so on wide it sits on the LEFT of the actions. */}
            <div className="flex min-w-0 flex-col items-center gap-4 @3xl:items-start" data-slot="cta-text">
              {eyebrow && (
                <span className="inline-flex w-fit items-center rounded-full border border-primary-foreground/40 px-3 py-1 text-sm font-semibold text-primary-foreground">
                  {pick(eyebrow, lang)}
                </span>
              )}

              <h2 className="text-balance text-3xl font-semibold tracking-tight text-primary-foreground @3xl:text-4xl">
                {pick(title, lang)}
              </h2>

              {subtitle && (
                <p className="max-w-xl text-pretty text-lg leading-relaxed text-primary-foreground">
                  {pick(subtitle, lang)}
                </p>
              )}
            </div>

            {/* ACTIONS block — below the text on narrow (stacked, full-width), on the RIGHT on wide.
                The relative geometry of text-vs-actions genuinely FLIPS (rule 2 / C6). */}
            <div
              data-slot="cta-actions"
              className="flex w-full flex-col gap-3 @sm:flex-row @sm:justify-center @3xl:w-auto @3xl:shrink-0"
            >
              <a
                href={primaryCta.href}
                className={cn(
                  ctaBase,
                  ctaFocus,
                  // INVERSE pairing: near-white/near-black fill with an accent-coloured label. The
                  // accent-tracking channel is the TEXT (text-primary = var(--primary)); the fill is
                  // the constant on-band foreground for maximum contrast (do NOT accent-fill on band).
                  "bg-primary-foreground text-primary transition-opacity hover:opacity-90",
                )}
              >
                {pick(primaryCta.label, lang)}
              </a>
              {secondaryCta && (
                <a
                  href={secondaryCta.href}
                  className={cn(
                    ctaBase,
                    ctaFocus,
                    // Ghost/outline on the band: transparent fill, on-band foreground border + label.
                    // Affordance is carried by the border + label, never colour alone (C10).
                    "border border-primary-foreground/60 text-primary-foreground transition-colors hover:bg-primary-foreground/10",
                  )}
                >
                  {pick(secondaryCta.label, lang)}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { CTASection }
