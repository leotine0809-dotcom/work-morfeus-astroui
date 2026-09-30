import { z } from "zod"

import { cn } from "@astro/ui"
import { langTextSchema, pick, useLang } from "../i18n"

// Hero — the FIRST marketing/landing-tier component (phase 33 t2), authored in the lab
// (spike/declarative-ui) and NOT yet promoted to @astro/ui. It honors the 6 non-negotiable rules
// from CONTEXT.md:
//   1. responsive: fluid widths + max-w + wrapping, no horizontal overflow at 320/768/1180/1440.
//   2. two DIFFERENT views: a real structural change via a Tailwind v4 @container query — wide
//      places the media BESIDE the text (two columns), narrow STACKS the text then simplifies the
//      media (mockup chrome + extra rows are omitted, the block drops below). Not one stack scaled.
//   3. i18n: every text prop is a { it, en } LangText, resolved through useLang() + pick — the
//      { it, en } object is NEVER rendered directly (no "[object Object]").
//   4. accent configurable: colour comes only from semantic tokens driven by the accent knob
//      (--primary / --ring / --accent-ink / --acc-dim / --acc-line), so changing the accent recolors it.
//   5. spacing defined: only the named spacing/radius scales (gap-*/p-*/rounded-*), no arbitrary values.
//   6. dark + light: only themed tokens, correct in both modes.
// The media slot is a plain-JSON descriptor { kind, src?, alt } (the attachment.tsx precedent),
// resolved internally to a real <img> or a token-styled mockup card — never raw code, never
// dangerouslySetInnerHTML.

export const heroPropsSchema = z.object({
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
  media: z.object({
    kind: z.enum(["image", "mockup"]),
    src: z.string().optional(),
    alt: langTextSchema,
  }),
})

export type HeroProps = z.infer<typeof heroPropsSchema>

// Shared focus-visible treatment for both CTAs: a visible ring in the accent colour, offset from
// the button so it reads on any surface, in both themes (WCAG 2.2 focus-visible).
const ctaFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, media }: HeroProps) {
  const lang = useLang()

  return (
    <section data-slot="hero" className="@container w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 @3xl:flex-row @3xl:items-center @3xl:gap-16 @3xl:py-24">
        {/* TEXT block — first in the DOM, so on the wide view it sits on the left of the media. */}
        <div className="flex min-w-0 flex-col items-start gap-5 @3xl:flex-1">
          {eyebrow && (
            <span className="inline-flex w-fit items-center rounded-full border border-[var(--acc-line)] bg-[var(--acc-dim)] px-3 py-1 text-sm font-semibold text-[var(--accent-ink)]">
              {pick(eyebrow, lang)}
            </span>
          )}

          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground @3xl:text-5xl">
            {pick(title, lang)}
          </h1>

          {subtitle && (
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {pick(subtitle, lang)}
            </p>
          )}

          <div className="mt-1 flex w-full flex-col gap-3 @sm:w-auto @sm:flex-row @sm:flex-wrap @sm:items-center">
            <a
              href={primaryCta.href}
              className={cn(
                "inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90",
                ctaFocus,
              )}
            >
              {pick(primaryCta.label, lang)}
            </a>
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className={cn(
                  "inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent",
                  ctaFocus,
                )}
              >
                {pick(secondaryCta.label, lang)}
              </a>
            )}
          </div>
        </div>

        {/* MEDIA slot — the structural difference (rule 2). On the narrow view it drops below the
            text and the mockup's chrome + extra rows are omitted (a genuine simplification); on the
            wide view it becomes the full mockup beside the text. */}
        <div data-slot="hero-media" className="w-full min-w-0 @3xl:flex-1">
          {media.kind === "image" && media.src ? (
            <img
              src={media.src}
              alt={pick(media.alt, lang)}
              className="w-full rounded-xl border border-border object-cover"
            />
          ) : (
            <div
              role="img"
              aria-label={pick(media.alt, lang)}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* window chrome — WIDE view only (omitted on narrow). */}
              <div className="hidden items-center gap-2 border-b border-border-soft bg-panel px-4 py-3 @3xl:flex">
                <span className="size-2.5 rounded-full bg-[var(--acc-line)]" />
                <span className="size-2.5 rounded-full bg-[var(--acc-line)]" />
                <span className="size-2.5 rounded-full bg-[var(--acc-line)]" />
              </div>
              <div className="grid gap-3 p-6">
                <div className="h-3 w-2/3 rounded-md bg-[var(--acc-dim)]" />
                <div className="h-3 w-full rounded-md bg-muted" />
                {/* extra body rows — WIDE view only (the narrow view is a simpler preview). */}
                <div className="hidden h-3 w-4/5 rounded-md bg-muted @3xl:block" />
                <div className="hidden h-3 w-3/5 rounded-md bg-muted @3xl:block" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export { Hero }
