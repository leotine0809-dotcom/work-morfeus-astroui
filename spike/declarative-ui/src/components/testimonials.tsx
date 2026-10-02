import { z } from "zod"

import { langTextSchema, pick, useLang } from "../i18n"
import { ICONS } from "./feature-icons"

// Testimonials — the EIGHTH marketing/landing-tier component (phase 40 t2): social proof, a set of
// quotes with an author (name + role), an optional avatar, and an optional 1..5 star rating.
// Authored in the lab (spike/declarative-ui) and NOT yet promoted to @astro/ui. It honors the 6
// non-negotiable rules from CONTEXT.md:
//   1. responsive: fluid widths + max-w + min-w-0/break-words, no horizontal overflow at
//      320/768/1180/1440. The narrow view is a horizontal scroll-snap CAROUSEL whose overflow-x
//      lives ONLY on the track container, so the carousel scrolls INTERNALLY and the PAGE never
//      scrolls sideways.
//   2. two DIFFERENT views: not a reflow but a real structural change via a Tailwind v4 @container
//      query on ONE `testimonial-track` container. WIDE (@3xl+) is a multi-column GRID where EVERY
//      card is visible on a shared band (no scroller). NARROW is a single-row `flex` with
//      overflow-x-auto + snap-x, each card ~one screen wide so the track scrolls one card at a time.
//      Both views render from the SAME `items` (one DOM, class switch), so a screen reader / axe
//      never double-counts.
//   3. i18n: every text (heading eyebrow/title/subtitle, each quote, each author role, each avatar
//      alt, the rating label) is a { it, en } LangText resolved through useLang() + pick — the
//      { it, en } object is NEVER rendered directly (no "[object Object]"). `author.name` is a plain
//      (untranslated) string rendered as-is.
//   4. accent configurable: the accent (--accent-ink / --acc-dim / --acc-line) appears ONLY on the
//      rating stars and the eyebrow mark, driven by the accent knob; the rest is neutral semantic
//      tokens (bg-card / bg-muted / text-foreground / text-muted-foreground / border-border).
//   5. spacing defined: only the named spacing/radius scales (gap-*/px-*/py-*/rounded-*), the card
//      is a hairline `border-border` surface; no arbitrary px/rem spacing or radius bracket.
//   6. dark + light: only themed tokens, correct in both modes (grid and carousel).
// The avatar is a plain-JSON descriptor { src?, alt } resolved internally to a real <img> when a
// `src` is declared, else to the author's INITIALS in a neutral circle (marked aria-hidden, the
// author name carries the meaning) — never a broken <img>, never raw code. The rating stars come
// from the owned ICONS["star"] name-token (never raw SVG through a prop) and are DECORATIVE
// (aria-hidden); the count is conveyed by an accessible { it, en } label on the rating group.

export const testimonialsPropsSchema = z.object({
  eyebrow: langTextSchema.optional(),
  title: langTextSchema.optional(),
  subtitle: langTextSchema.optional(),
  // Optional { it, en } template for the rating's accessible label, with a `{n}` placeholder the
  // component interpolates with the numeric rating (e.g. { it: "{n} su 5", en: "{n} out of 5" }).
  ratingLabel: langTextSchema.optional(),
  // Required and NON-EMPTY: an empty `items` is a contract error, `items` absent is a required-field
  // error (both surface as InvalidComponentPropsError naming `items`).
  items: z
    .array(
      z.object({
        quote: langTextSchema,
        author: z.object({
          // A person's name is NOT translated: a plain string, never a { it, en } pair.
          name: z.string(),
          role: langTextSchema,
        }),
        // Optional structured descriptor: a URL + { it, en } alt, never raw markup.
        avatar: z
          .object({
            src: z.string().optional(),
            alt: langTextSchema,
          })
          .optional(),
        // Optional integer 1..5: 0, 6, and 2.5 are each a contract error.
        rating: z.number().int().min(1).max(5).optional(),
      }),
    )
    .min(1),
})

export type TestimonialsProps = z.infer<typeof testimonialsPropsSchema>

// The star name-token resolved internally (it is NOT a prop, per C7).
const Star = ICONS["star"]

// A component-internal DEFAULT { it, en } rating-label template, so the accessible label ALWAYS
// exists, flips with language, and is never a hardcoded one-language literal (C6/C10).
const DEFAULT_RATING_LABEL = { it: "{n} su 5", en: "{n} out of 5" } as const

// A component-internal DEFAULT { it, en } accessible name for the carousel track. On NARROW the track
// is a horizontal scroll region (overflow-x-auto snap-x); a keyboard user must be able to focus it to
// scroll (WCAG 2.1.1). So the track is role="region" with tabIndex 0 and THIS label (resolved through
// pick so it flips with language, never a one-language literal). On WIDE the track is an
// overflow-visible grid where the extra tab stop is harmless.
const DEFAULT_REGION_LABEL = { it: "Testimonianze", en: "Testimonials" } as const

// The author's INITIALS: the first character of up to the first two whitespace-separated words of
// `author.name`, uppercased (e.g. "Fabio Denuzzo" -> "FD"). Decorative fallback for a missing avatar.
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}

function Testimonials({ eyebrow, title, subtitle, ratingLabel, items }: TestimonialsProps) {
  const lang = useLang()

  return (
    // The <section> IS the @container, so a fixed-width preview frame triggers the two-view (rule 2).
    // A SOLID surface token so axe AA holds in both themes.
    <section data-slot="testimonials" className="@container w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 @3xl:py-24">
        {/* Optional heading block: rendered only when a field is declared, so a heading-less
            declaration renders items-only (C3b). */}
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

        {/* ONE track container (rule 2). NARROW: a single-row flex with overflow-x-auto + snap so the
            cards scroll INTERNALLY one at a time (overflow-x confined here, never the page/section).
            WIDE (@3xl+): a multi-column grid where every card shows on a shared band, overflow visible
            and snap off (not a scroller). Same `items`, one DOM, class switch. */}
        <div
          data-slot="testimonial-track"
          role="region"
          aria-label={pick(DEFAULT_REGION_LABEL, lang)}
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background @3xl:grid @3xl:grid-cols-2 @3xl:snap-none @3xl:gap-6 @3xl:overflow-visible @4xl:grid-cols-3"
        >
          {items.map((item, i) => (
            <article
              key={i}
              data-slot="testimonial"
              className="flex min-w-0 shrink-0 basis-[85%] snap-start flex-col gap-4 rounded-2xl border border-border bg-card p-6 @3xl:basis-auto"
            >
              {/* Rating group (C6/C15): rendered only when declared. role="img" + aria-label carries
                  the count; the star glyphs are DECORATIVE (aria-hidden), accent-tinted so the accent
                  knob recolors both fill and stroke (C11). Count is conveyed by the label, never by
                  the star shape/colour alone. */}
              {item.rating !== undefined && (
                <div
                  data-slot="testimonial-rating"
                  role="img"
                  aria-label={pick(ratingLabel ?? DEFAULT_RATING_LABEL, lang).replace(
                    "{n}",
                    String(item.rating),
                  )}
                  className="flex items-center gap-0.5"
                >
                  {Array.from({ length: item.rating }).map((_, s) => (
                    <Star
                      key={s}
                      aria-hidden="true"
                      className="size-4 fill-[var(--accent-ink)] text-[var(--accent-ink)]"
                    />
                  ))}
                </div>
              )}

              {/* Quote: text-foreground, min-w-0 + break-words so long copy never pushes sideways. */}
              <blockquote className="min-w-0 break-words text-pretty leading-relaxed text-foreground">
                {pick(item.quote, lang)}
              </blockquote>

              {/* Author row — avatar (image or initials fallback) + name/role. */}
              <div className="mt-auto flex items-center gap-3">
                {item.avatar?.src ? (
                  <img
                    src={item.avatar.src}
                    alt={pick(item.avatar.alt, lang)}
                    className="size-10 shrink-0 rounded-full border border-border object-cover"
                  />
                ) : (
                  // Initials fallback (C5): a neutral token circle, aria-hidden (decorative — the
                  // visible author name carries the meaning), never a broken/empty <img>.
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground"
                  >
                    {initials(item.author.name)}
                  </span>
                )}
                <div className="flex min-w-0 flex-col">
                  {/* author.name is a plain string, rendered as-is (unchanged by language). */}
                  <span className="min-w-0 break-words font-medium text-foreground">
                    {item.author.name}
                  </span>
                  <span className="min-w-0 break-words text-sm text-muted-foreground">
                    {pick(item.author.role, lang)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export { Testimonials }
