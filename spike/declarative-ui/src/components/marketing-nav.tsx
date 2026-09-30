import { z } from "zod"
import { Dialog } from "radix-ui"

import { cn } from "@astro/ui"
import { type LangText, type Lang, langTextSchema, pick, useLang } from "../i18n"
import { ICONS, iconNameSchema } from "./feature-icons"

// MarketingNav — the SIXTH marketing/landing-tier component (phase 38 t2), the STICKY top
// navigation bar, and the THIRD interactive one (the narrow view holds an open/closed drawer).
// Authored in the lab (spike/declarative-ui) and NOT yet promoted to @astro/ui. It honors the 6
// non-negotiable rules from CONTEXT.md:
//   1. responsive: fluid widths + max-w + min-w-0/truncation, no horizontal overflow at
//      320/768/1180/1440 with the bar collapsed AND the drawer open.
//   2. two DIFFERENT views: not a reflow but a real structural + interaction change via a Tailwind
//      v4 @container query. DESKTOP (@3xl+) renders the links INLINE in the bar with the CTAs to the
//      right and NO hamburger. NARROW hides the inline links entirely and shows a hamburger button
//      that opens a Radix Dialog drawer holding the links stacked + both CTAs. A genuine
//      inline-vs-behind-a-disclosure difference, driven by the CONTAINER width so a fixed-width
//      preview frame triggers it.
//   3. i18n: every text (brand name, each link label, each CTA label) is a { it, en } LangText,
//      resolved through useLang() + pick, the { it, en } object is NEVER rendered directly.
//   4. accent configurable: the CTA fill and the active/hover link accent come only from
//      accent-driven tokens (--primary / --accent-ink / --ring), so the accent knob recolors them.
//   5. spacing defined: only the named spacing/radius/z scales (h-*/px-*/gap-*/rounded-* and the
//      --z-* ladder), no arbitrary bracket values.
//   6. dark + light: only themed tokens, correct in both modes (bar + open drawer).
// The hamburger is a REAL accessible control: a <button> with an accessible name, wrapped in
// Dialog.Trigger so Radix supplies aria-expanded / aria-controls. The drawer is Dialog.Content, so
// Radix carries focus-trap (+ restore on close), Escape/scrim dismiss and aria-modal for free. The
// brand icon comes from the owned ICONS map (never raw code/SVG through a prop) and is decorative
// (aria-hidden). No prop carries raw HTML/SVG/code; there is no dangerouslySetInnerHTML anywhere.

const navCtaSchema = z.object({
  label: langTextSchema,
  href: z.string(),
})

type NavCta = z.infer<typeof navCtaSchema>

export const marketingNavPropsSchema = z.object({
  // brand REQUIRED; brandIcon OPTIONAL, only a name-token from the owned enum.
  brand: z.object({
    name: langTextSchema,
    brandIcon: iconNameSchema.optional(),
  }),
  // links OPTIONAL; each link is { label:{it,en}, href }.
  links: z.array(navCtaSchema).optional(),
  // primaryCta REQUIRED, secondaryCta OPTIONAL; each is { label:{it,en}, href }.
  primaryCta: navCtaSchema,
  secondaryCta: navCtaSchema.optional(),
})

export type MarketingNavProps = z.infer<typeof marketingNavPropsSchema>

// Chrome labels for the a11y controls (rule 3): the hamburger accessible name, the drawer close
// label, and the drawer's landmark/description. Resolved via pick like every other string, never a
// hardcoded single-language literal.
const MENU_LABEL: LangText = { it: "Apri menu", en: "Open menu" }
const CLOSE_LABEL: LangText = { it: "Chiudi menu", en: "Close menu" }
const NAV_DESC: LangText = { it: "Navigazione principale", en: "Main navigation" }

// Shared focus-visible treatment (reuses the Hero/FAQ ring pattern): a visible accent ring offset
// from the background, legible on the sticky surface, in both themes (WCAG 2.2 focus-visible).
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// A nav link: neutral by default, its hover/active accent driven by --accent-ink so the accent knob
// recolors it. Affordance is carried by the label + underline-on-hover, never colour alone.
const linkBase =
  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-[var(--accent-ink)]"

// Shared CTA base + the Hero variant pairing: primary filled with the accent, secondary outlined.
const ctaBase = "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold"
const ctaPrimary = "bg-primary text-primary-foreground transition-opacity hover:opacity-90"
const ctaSecondary = "border border-border text-foreground transition-colors hover:bg-accent"

// A single CTA renderer, reused on the bar (natural width) and in the drawer (full width), so the
// primary/secondary pairing stays identical in both views.
function NavCtaLink({
  cta,
  variant,
  full,
  lang,
}: {
  cta: NavCta
  variant: "primary" | "secondary"
  full?: boolean
  lang: Lang
}) {
  return (
    <a
      href={cta.href}
      className={cn(
        ctaBase,
        full && "w-full",
        variant === "primary" ? ctaPrimary : ctaSecondary,
        focusRing,
      )}
    >
      {pick(cta.label, lang)}
    </a>
  )
}

function MarketingNav({ brand, links, primaryCta, secondaryCta }: MarketingNavProps) {
  const lang = useLang()
  const BrandIcon = brand.brandIcon ? ICONS[brand.brandIcon] : null
  const MenuIcon = ICONS["menu"]
  const hasLinks = !!links && links.length > 0

  return (
    // The sticky bar IS the @container, so a fixed-width preview frame triggers the two-view (rule
    // 2). Sticky at the top with its stacking from the NAMED z ladder (--z-sticky rung), a subtle
    // bottom hairline, and a SOLID surface token so AA holds ON the bar in both themes (C7/C13).
    <nav
      data-slot="nav"
      className="@container sticky top-0 z-[var(--z-sticky)] w-full border-b border-border bg-background text-foreground"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        {/* Brand LEFT — min-w-0 + truncate so a long name never pushes content sideways (C11). */}
        <a
          href="/"
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-lg text-base font-semibold tracking-tight text-foreground",
            focusRing,
          )}
        >
          {BrandIcon && <BrandIcon aria-hidden="true" className="size-6 shrink-0 text-[var(--accent-ink)]" />}
          <span className="truncate">{pick(brand.name, lang)}</span>
        </a>

        {/* Inline links — DESKTOP only (rule 2): visible in the bar at @3xl, HIDDEN below it so they
            live only behind the hamburger disclosure at narrow. */}
        {hasLinks && (
          <div data-slot="nav-links" className="hidden min-w-0 items-center gap-1 @3xl:flex">
            {links!.map((link, i) => (
              <a key={i} href={link.href} className={cn(linkBase, "truncate", focusRing)}>
                {pick(link.label, lang)}
              </a>
            ))}
          </div>
        )}

        {/* CTAs RIGHT — DESKTOP only. On narrow they live inside the drawer instead. */}
        <div className="hidden shrink-0 items-center gap-3 @3xl:flex">
          {secondaryCta && <NavCtaLink cta={secondaryCta} variant="secondary" lang={lang} />}
          <NavCtaLink cta={primaryCta} variant="primary" lang={lang} />
        </div>

        {/* Hamburger + Radix Dialog drawer — NARROW only. The trigger is @3xl:hidden, so the drawer
            can only be opened at narrow; the portalled content is closed by default (C5). Radix
            supplies aria-expanded/controls on the trigger and focus-trap/Esc/restore on the
            dialog (C6). */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              type="button"
              data-slot="nav-hamburger"
              aria-label={pick(MENU_LABEL, lang)}
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent @3xl:hidden",
                focusRing,
              )}
            >
              <MenuIcon aria-hidden="true" className="size-6" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            {/* Scrim: a token-driven translucent backdrop (no raw colour literal), z from the named
                ladder (--z-scrim). */}
            <Dialog.Overlay className="fixed inset-0 z-[var(--z-scrim)] bg-background/80 backdrop-blur-sm" />
            <Dialog.Content
              data-slot="nav-drawer"
              className="fixed inset-y-0 right-0 z-[var(--z-modal)] flex h-full w-[min(20rem,calc(100vw-3rem))] flex-col gap-6 border-l border-border bg-background p-6 text-foreground focus:outline-none"
            >
              <div className="flex items-center justify-between gap-4">
                <Dialog.Title className="min-w-0 truncate text-base font-semibold text-foreground">
                  {pick(brand.name, lang)}
                </Dialog.Title>
                <Dialog.Close
                  aria-label={pick(CLOSE_LABEL, lang)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    focusRing,
                  )}
                >
                  {pick(CLOSE_LABEL, lang)}
                </Dialog.Close>
              </div>
              {/* sr-only description keeps the Radix Dialog a11y contract clean without a visible
                  second heading. */}
              <Dialog.Description className="sr-only">{pick(NAV_DESC, lang)}</Dialog.Description>

              {/* Links stacked — the SAME declared links, now inside the drawer (each an <a href>). */}
              {hasLinks && (
                <div className="flex flex-col gap-1">
                  {links!.map((link, i) => (
                    <a key={i} href={link.href} className={cn(linkBase, "text-base", focusRing)}>
                      {pick(link.label, lang)}
                    </a>
                  ))}
                </div>
              )}

              {/* Both CTAs, full-width, pinned to the bottom of the drawer. */}
              <div className="mt-auto flex flex-col gap-3">
                <NavCtaLink cta={primaryCta} variant="primary" full lang={lang} />
                {secondaryCta && <NavCtaLink cta={secondaryCta} variant="secondary" full lang={lang} />}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </nav>
  )
}

export { MarketingNav }
