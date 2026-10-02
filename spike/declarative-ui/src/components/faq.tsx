import { z } from "zod"
import { Accordion } from "radix-ui"

import { cn } from "@astro/ui"
import { langTextSchema, pick, useLang } from "../i18n"
import { ICONS } from "./feature-icons"

// FAQ: the FOURTH marketing/landing-tier component (phase 36 t2), and the SECOND interactive one
// (the narrow view holds open/closed accordion state). Authored in the lab (spike/declarative-ui)
// and NOT yet promoted to @astro/ui. It honors the 6 non-negotiable rules from CONTEXT.md:
//   1. responsive: fluid widths + max-w, no horizontal overflow at 320/768/1180/1440 in BOTH the
//      collapsed and the expanded narrow state.
//   2. two DIFFERENT views: not a reflow but a real structural + interaction change via a Tailwind
//      v4 @container query. NARROW is a single-column Radix Accordion where each answer is COLLAPSED
//      until its trigger is activated (one open at a time). WIDE is a 2-column grid where EVERY
//      answer is ALWAYS visible (no collapsing, no interaction). Both branches render from the SAME
//      declared `items`; only the branch that matches the container width is in layout, the other is
//      display:none (so a screen reader / axe never double-counts).
//   3. i18n: every text (heading eyebrow/title/subtitle + each item's question/answer) is a
//      { it, en } LangText, resolved through useLang() + pick, the { it, en } object is NEVER
//      rendered directly (no "[object Object]").
//   4. accent configurable: the accent surfaces (open-item marker, trigger focus-visible ring,
//      chevron tint) come only from accent-driven semantic tokens (--primary / --ring /
//      --accent-ink), so turning the accent knob recolors them; the rest is neutral semantic tokens.
//   5. spacing defined: only the named spacing/radius scales (gap-*/p-*/rounded-*), no arbitrary
//      bracket values.
//   6. dark + light: only themed tokens, correct in both modes.
// The narrow accordion is a REAL accessible disclosure built on the Radix Accordion primitive: each
// trigger is a <button> with aria-expanded + aria-controls to its region, natively keyboard operable
// (Space/Enter toggles, arrow keys move between triggers), with a visible focus-visible ring. The
// chevron comes from the owned ICONS["chevron-down"] map (never raw code/SVG through a prop) and is
// DECORATIVE (aria-hidden): meaning is carried by the visible question text + the aria-expanded
// state, never by the icon or colour alone.

const faqItemSchema = z.object({
  question: langTextSchema,
  answer: langTextSchema,
})

export const faqPropsSchema = z.object({
  eyebrow: langTextSchema.optional(),
  title: langTextSchema.optional(),
  subtitle: langTextSchema.optional(),
  // Required and NON-EMPTY: an empty `items` is a contract error, `items` absent is a required-field
  // error (both surface as InvalidComponentPropsError naming `items`).
  items: z.array(faqItemSchema).min(1),
})

export type FaqProps = z.infer<typeof faqPropsSchema>

// Shared focus-visible treatment (reuses the Hero/Pricing ring pattern): a visible accent ring
// offset from the background, in both themes (WCAG 2.2 focus-visible).
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

const ChevronDown = ICONS["chevron-down"]

function FAQ({ eyebrow, title, subtitle, items }: FaqProps) {
  const lang = useLang()

  return (
    <section data-slot="faq" className="@container w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 @3xl:py-24">
        {/* Optional heading block: rendered only when a field is declared, so an FAQ with no heading
            fields renders items-only (C4b). */}
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

        {/* NARROW branch (rule 2): a single-column Radix Accordion, type="single" + collapsible, with
            NO default value, so every answer starts COLLAPSED and opening a second item closes the
            first (single-open). Hidden at the wide breakpoint so it is not in layout / not announced
            there. */}
        <Accordion.Root
          type="single"
          collapsible
          className="flex flex-col gap-3 @3xl:hidden"
        >
          {items.map((item, i) => (
            <Accordion.Item
              key={i}
              value={`item-${i}`}
              data-slot="faq-item"
              // The accent open-item marker (C4/C9): the item's border turns to the accent --primary
              // when open. This is a SUPPLEMENT to the disclosure state / revealed answer / rotated
              // chevron, never the sole signal of open/closed (C11: not colour alone).
              className="rounded-xl border border-border bg-card data-[state=open]:border-primary"
            >
              <Accordion.Header className="flex">
                <Accordion.Trigger
                  data-slot="faq-question"
                  className={cn(
                    "group flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-base font-semibold text-foreground transition-colors hover:bg-accent",
                    focusRing,
                  )}
                >
                  <span className="min-w-0">{pick(item.question, lang)}</span>
                  {/* Decorative chevron (aria-hidden): accent-tinted, rotates on open via the
                      trigger's data-state. */}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-[var(--accent-ink)] transition-transform group-data-[state=open]:rotate-180"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content
                data-slot="faq-answer"
                className="overflow-hidden px-5 pb-4"
              >
                <p className="text-pretty leading-relaxed text-muted-foreground">
                  {pick(item.answer, lang)}
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        {/* WIDE branch (rule 2): a 2-column grid where every item shows its question AND answer
            ALWAYS (no collapsing, no interaction, no chevron). Hidden below the wide breakpoint so
            only ONE branch is ever in layout at a given width. */}
        <div className="hidden @3xl:grid @3xl:grid-cols-2 @3xl:gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              data-slot="faq-item"
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
            >
              <h3 data-slot="faq-question" className="text-lg font-semibold text-foreground">
                {pick(item.question, lang)}
              </h3>
              <p
                data-slot="faq-answer"
                className="text-pretty leading-relaxed text-muted-foreground"
              >
                {pick(item.answer, lang)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { FAQ }
