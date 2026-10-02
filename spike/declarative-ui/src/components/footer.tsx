import { z } from "zod"
import { Accordion } from "radix-ui"

import { cn } from "@astro/ui"
import { langTextSchema, pick, useLang } from "../i18n"
import { ICONS, iconNameSchema } from "./feature-icons"

// Footer — the SEVENTH marketing/landing-tier component (phase 39 t2), the site footer (brand + link
// columns + optional social row + bottom legal bar), and the FOURTH interactive one (the narrow view
// holds open/closed accordion state per column). Authored in the lab (spike/declarative-ui) and NOT
// yet promoted to @astro/ui. It honors the 6 non-negotiable rules from CONTEXT.md:
//   1. responsive: fluid widths + max-w + min-w-0/break-words, no horizontal overflow at
//      320/768/1180/1440 with the columns COLLAPSED and EXPANDED.
//   2. two DIFFERENT views: not a reflow but a real structural + interaction change via a Tailwind
//      v4 @container query. NARROW is a stacked set of Radix Accordion columns where each column's
//      links are COLLAPSED until its heading is activated (independent, type="multiple"). WIDE
//      (@3xl+) is an always-open multi-column grid where EVERY column's links are visible with no
//      disclosure. Both branches render from the SAME declared `columns`; only the branch matching
//      the container width is in layout, the other is display:none (so a screen reader / axe never
//      double-counts).
//   3. i18n: every text (brand name/tagline, each column heading, each link label, each social
//      label, the copyright, each legal link) is a { it, en } LangText, resolved through useLang() +
//      pick — the { it, en } object is NEVER rendered directly (no "[object Object]").
//   4. accent configurable: link hover/active and social accents come only from accent-driven
//      semantic tokens (--accent-ink / --ring), so turning the accent knob recolors them; the rest
//      is neutral semantic tokens.
//   5. spacing defined: only the named spacing/radius scales (gap-*/px-*/py-*/rounded-*), no
//      arbitrary bracket values; the section + bottom-bar dividers are hairline `border-border`.
//   6. dark + light: only themed tokens, correct in both modes (columns collapsed + expanded).
// The narrow accordion is a REAL accessible disclosure built on the Radix Accordion primitive: each
// heading is a <button> with aria-expanded + aria-controls to its links region, natively keyboard
// operable (Space/Enter toggles, arrow keys move between headings), with a visible focus-visible
// ring. Each social link carries an accessible name from its { it, en } label while its lucide glyph
// is DECORATIVE (aria-hidden) — meaning is never carried by the icon or colour alone. The brand +
// social glyphs come from the owned ICONS map (never raw code/SVG through a prop); there is no
// dangerouslySetInnerHTML anywhere.

const footerLinkSchema = z.object({
  label: langTextSchema,
  href: z.string(),
})

const footerColumnSchema = z.object({
  heading: langTextSchema,
  // Required and NON-EMPTY: a column with no links is a contract error naming `links`.
  links: z.array(footerLinkSchema).min(1),
})

const footerSocialSchema = z.object({
  // Only a name-token from the owned enum; a raw SVG/code string or out-of-enum name is refused.
  icon: iconNameSchema,
  href: z.string(),
  label: langTextSchema,
})

export const footerPropsSchema = z.object({
  // brand REQUIRED; brandIcon + tagline OPTIONAL (brandIcon only a name-token from the owned enum).
  brand: z.object({
    name: langTextSchema,
    brandIcon: iconNameSchema.optional(),
    tagline: langTextSchema.optional(),
  }),
  // columns REQUIRED and NON-EMPTY.
  columns: z.array(footerColumnSchema).min(1),
  // social OPTIONAL: an icon-link row rendered only when declared.
  social: z.array(footerSocialSchema).optional(),
  // bottom REQUIRED: copyright + OPTIONAL legal links.
  bottom: z.object({
    copyright: langTextSchema,
    legalLinks: z.array(footerLinkSchema).optional(),
  }),
})

export type FooterProps = z.infer<typeof footerPropsSchema>

// Shared focus-visible treatment (reuses the Hero/FAQ/MarketingNav ring pattern): a visible accent
// ring offset from the background, legible in both themes (WCAG 2.2 focus-visible).
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// A footer link: neutral by default, its hover/active accent driven by --accent-ink so the accent
// knob recolors it. break-words keeps a long label from pushing the layout sideways (C7).
const linkBase =
  "block break-words rounded-lg text-sm text-muted-foreground transition-colors hover:text-[var(--accent-ink)]"

const ChevronDown = ICONS["chevron-down"]

function Footer({ brand, columns, social, bottom }: FooterProps) {
  const lang = useLang()
  const BrandIcon = brand.brandIcon ? ICONS[brand.brandIcon] : null

  return (
    // The <footer> IS the @container, so a fixed-width preview frame triggers the two-view (rule 2).
    // A SOLID surface token so AA holds on the footer in both themes.
    <footer data-slot="footer" className="@container w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 @3xl:py-20">
        <div className="flex flex-col gap-10 @3xl:flex-row @3xl:justify-between @3xl:gap-16">
          {/* Brand block — name (min-w-0 + truncate so a long name never overflows, C7), optional
              accent-tinted brand icon, optional tagline. */}
          <div
            data-slot="footer-brand"
            className="flex min-w-0 flex-col gap-4 @3xl:max-w-sm @3xl:flex-1"
          >
            <div className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              {BrandIcon && (
                <BrandIcon aria-hidden="true" className="size-6 shrink-0 text-[var(--accent-ink)]" />
              )}
              <span className="truncate">{pick(brand.name, lang)}</span>
            </div>
            {brand.tagline && (
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {pick(brand.tagline, lang)}
              </p>
            )}
          </div>

          {/* NARROW branch (rule 2): a stacked Radix Accordion, type="multiple" so each column is an
              INDEPENDENT disclosure with NO default value — every column's links start COLLAPSED and
              open on activation. Hidden at @3xl so it is not in layout / not announced there. */}
          <Accordion.Root
            type="multiple"
            className="flex min-w-0 flex-col @3xl:hidden"
          >
            {columns.map((column, i) => (
              <Accordion.Item
                key={i}
                value={`col-${i}`}
                data-slot="footer-col"
                className="border-b border-border"
              >
                <Accordion.Header className="flex">
                  <Accordion.Trigger
                    data-slot="footer-col-heading"
                    className={cn(
                      "group flex w-full items-center justify-between gap-4 rounded-lg py-4 text-left text-sm font-semibold text-foreground transition-colors hover:text-[var(--accent-ink)]",
                      focusRing,
                    )}
                  >
                    <span className="min-w-0 break-words">{pick(column.heading, lang)}</span>
                    {/* Decorative chevron (aria-hidden): accent-tinted, rotates on open via the
                        trigger's data-state — the disclosure state is also carried by aria-expanded
                        + the revealed links, never the icon or colour alone. */}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 shrink-0 text-[var(--accent-ink)] transition-transform group-data-[state=open]:rotate-180"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content data-slot="footer-col-links" className="overflow-hidden pb-4">
                  <ul className="flex flex-col gap-3">
                    {column.links.map((link, j) => (
                      <li key={j} className="min-w-0">
                        <a href={link.href} className={cn(linkBase, focusRing)}>
                          {pick(link.label, lang)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>

          {/* WIDE branch (rule 2): an always-open multi-column grid where every column's links are
              visible simultaneously (no disclosure, no chevron). auto-cols-fr + grid-flow-col makes
              the declared columns share ONE row so >=2 columns are side by side. Hidden below @3xl so
              only ONE branch is ever in layout at a given width. */}
          <div className="hidden gap-8 @3xl:grid @3xl:auto-cols-fr @3xl:grid-flow-col">
            {columns.map((column, i) => (
              <div key={i} data-slot="footer-col" className="flex min-w-0 flex-col gap-4">
                <h3
                  data-slot="footer-col-heading"
                  className="break-words text-sm font-semibold text-foreground"
                >
                  {pick(column.heading, lang)}
                </h3>
                <ul data-slot="footer-col-links" className="flex flex-col gap-3">
                  {column.links.map((link, j) => (
                    <li key={j} className="min-w-0">
                      <a href={link.href} className={cn(linkBase, focusRing)}>
                        {pick(link.label, lang)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Social row — rendered ONLY when declared. Each is an <a href> whose accessible name is the
            { it, en } label (aria-label) with a DECORATIVE aria-hidden lucide glyph (C12). */}
        {social && social.length > 0 && (
          <div data-slot="footer-social" className="flex flex-wrap items-center gap-2">
            {social.map((entry, i) => {
              const SocialIcon = ICONS[entry.icon]
              return (
                <a
                  key={i}
                  href={entry.href}
                  aria-label={pick(entry.label, lang)}
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-[var(--accent-ink)]",
                    focusRing,
                  )}
                >
                  <SocialIcon aria-hidden="true" className="size-5" />
                </a>
              )
            })}
          </div>
        )}

        {/* Bottom bar — a hairline-topped row (border-t border-border) with the copyright + optional
            legal links. Stacks on narrow, spreads on wide. */}
        <div
          data-slot="footer-bottom"
          className="flex flex-col gap-4 border-t border-border pt-8 @3xl:flex-row @3xl:items-center @3xl:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-muted-foreground">
            {pick(bottom.copyright, lang)}
          </p>
          {bottom.legalLinks && bottom.legalLinks.length > 0 && (
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {bottom.legalLinks.map((link, i) => (
                <li key={i} className="min-w-0">
                  <a href={link.href} className={cn(linkBase, focusRing)}>
                    {pick(link.label, lang)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  )
}

export { Footer }
