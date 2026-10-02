import * as React from "react"
import { createRoot } from "react-dom/client"

import "./globals.css"
import { renderConversation } from "@/pipeline"
import type { A2uiTree } from "@/a2ui/schema"
import { ACCENTS, type Accent, ThemeIcon } from "@/settings"
import { LangProvider, type Lang } from "@/i18n"

// astro-ui · lab — a living catalogue. It is built WITH astro-ui: every demo below is a DECLARED
// A2UI tree rendered through the SAME pipeline the app uses (adapter → Zod → allow-list → registry).
// If a component renders here, an LLM can declare it. The page chrome (grid, labels, theme/accent
// controls) is thin host code — the components themselves never bypass the renderer.

type Node = A2uiTree["nodes"][number]
const P = (o: Record<string, unknown>) => o as Node["props"]
const tree = (nodes: Node[]): A2uiTree => ({ nodes })
const one = (type: string, props: Record<string, unknown>): A2uiTree => tree([{ id: "root", type, props: P(props) }])
// a Stack(row|column) of sibling variants — layout itself dogfoods the Stack primitive
const strip = (dir: "row" | "column", items: { type: string; props: Record<string, unknown> }[], gap = 12): A2uiTree => {
  const kids: Node[] = items.map((it, i) => ({ id: `i${i}`, type: it.type, props: P(it.props) }))
  return tree([{ id: "root", type: "Stack", props: P({ direction: dir, gap, align: "start" }), childrenIds: kids.map((k) => k.id) }, ...kids])
}

function Demo({ t }: { t: A2uiTree }) {
  return <>{renderConversation(t)}</>
}

// a labelled stage card (host chrome). `frame` sizes the content area for components that need it.
function Stage({ label, note, frame, children }: { label: string; note?: string; frame?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-[var(--panel)]">
      <div className="flex items-baseline justify-between gap-3 border-b border-border-soft px-3 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground">{label}</span>
        {note && <span className="truncate font-mono text-[10.5px] text-faint">{note}</span>}
      </div>
      <div className={`bg-background p-4 ${frame ?? ""}`}>{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">{children}</div>
    </section>
  )
}

// ── the catalogue ─────────────────────────────────────────────────────────────────────────
const LINK = "Hey @[Alex] — see the [launch deck](https://northwind.example/deck)?"

// The three product declarations (phase 33 t4, C7). ONE Hero component, three separate type:"Hero"
// A2UI trees that differ ONLY in the declared {it,en} data — proving the thesis: same component,
// change only the declared text, get a new site. Copy is placeholder, anchored strictly to
// CONTEXT.md's pitches (all three are MCP-first), NOT embellished beyond them.
const HEROES: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("Hero", {
      eyebrow: { it: "Agentico · MCP-first", en: "Agentic · MCP-first" },
      title: { it: "Comanda la tua flotta di agenti", en: "Command your fleet of agents" },
      subtitle: { it: "Agentico e MCP-first.", en: "Agentic and MCP-first." },
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#astrobot" },
      secondaryCta: { label: { it: "Scopri di più", en: "Learn more" }, href: "#astrobot-more" },
      media: { kind: "mockup", alt: { it: "Anteprima della console astrobot", en: "astrobot console preview" } },
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("Hero", {
      eyebrow: { it: "Astro Calendar", en: "Astro Calendar" },
      title: { it: "Tutti i calendari e le email in un posto solo", en: "Every calendar and inbox in one place" },
      subtitle: { it: "Aggrega più calendari ed email, con trascrizione in chiamata.", en: "Aggregates multiple calendars and emails, with in-call transcription." },
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#calendar" },
      secondaryCta: { label: { it: "Scopri di più", en: "Learn more" }, href: "#calendar-more" },
      media: { kind: "mockup", alt: { it: "Anteprima di Astro Calendar", en: "Astro Calendar preview" } },
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("Hero", {
      eyebrow: { it: "Astro", en: "Astro" },
      title: { it: "Parla con le persone su tanti canali, in un posto solo", en: "Talk to people across many channels, in one place" },
      subtitle: { it: "Un solo posto per tutti i tuoi canali.", en: "One place for all your channels." },
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#astro" },
      secondaryCta: { label: { it: "Scopri di più", en: "Learn more" }, href: "#astro-more" },
      media: { kind: "mockup", alt: { it: "Anteprima di Astro", en: "Astro preview" } },
    }),
  },
]

// FeatureGrid demo declarations (phase 34 t4, C10). ONE FeatureGrid component, three separate
// type:"FeatureGrid" A2UI trees that differ ONLY in the declared {it,en} data — the same thesis the
// Heroes prove: change only the declared text (and the icon name-tokens), get a new section. Each
// grid declares an optional {it,en} heading plus items[] whose `icon` values come from the curated
// enum (feature-icons.ts). Copy is placeholder, anchored strictly to CONTEXT.md's product pitches
// (the same three products as the Heroes), NOT embellished beyond them.
const FEATURES: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("FeatureGrid", {
      eyebrow: { it: "Agentico · MCP-first", en: "Agentic · MCP-first" },
      title: { it: "Comanda la tua flotta di agenti", en: "Command your fleet of agents" },
      subtitle: { it: "Agentico e MCP-first.", en: "Agentic and MCP-first." },
      items: [
        {
          icon: "bot",
          title: { it: "Flotta di agenti", en: "Fleet of agents" },
          description: { it: "Comanda più agenti da un posto solo.", en: "Command many agents from one place." },
        },
        {
          icon: "plug",
          title: { it: "MCP-first", en: "MCP-first" },
          description: { it: "Collega i tuoi strumenti via MCP.", en: "Connect your tools over MCP." },
        },
        {
          icon: "workflow",
          title: { it: "Agentico", en: "Agentic" },
          description: { it: "Gli agenti lavorano per te.", en: "Agents work on your behalf." },
        },
      ],
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("FeatureGrid", {
      eyebrow: { it: "Astro Calendar", en: "Astro Calendar" },
      title: { it: "Tutti i calendari e le email in un posto solo", en: "Every calendar and inbox in one place" },
      items: [
        {
          icon: "calendar",
          title: { it: "Più calendari", en: "Multiple calendars" },
          description: { it: "Aggrega più calendari in una vista.", en: "Aggregate multiple calendars in one view." },
        },
        {
          icon: "mail",
          title: { it: "Più email", en: "Multiple inboxes" },
          description: { it: "Aggrega più email in un posto solo.", en: "Aggregate multiple inboxes in one place." },
        },
        {
          icon: "message-circle",
          title: { it: "Trascrizione in chiamata", en: "In-call transcription" },
          description: { it: "Trascrive le tue chiamate.", en: "Transcribes your calls." },
        },
      ],
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("FeatureGrid", {
      eyebrow: { it: "Astro", en: "Astro" },
      title: { it: "Parla con le persone su tanti canali, in un posto solo", en: "Talk to people across many channels, in one place" },
      items: [
        {
          icon: "layers",
          title: { it: "Un posto solo", en: "One place" },
          description: { it: "Tutti i tuoi canali in un posto solo.", en: "All your channels in one place." },
        },
        {
          icon: "message-circle",
          title: { it: "Tante conversazioni", en: "Many conversations" },
          description: { it: "Parla con le persone su tanti canali.", en: "Talk to people across many channels." },
        },
        {
          icon: "globe",
          title: { it: "Tanti canali", en: "Many channels" },
          description: { it: "Aggrega i canali che già usi.", en: "Aggregates the channels you already use." },
        },
      ],
    }),
  },
]

// Pricing demo declarations (phase 35 t3, C13). ONE Pricing component, three separate
// type:"Pricing" A2UI trees that differ ONLY in the declared {it,en} data (and the fake currency
// strings) — the same thesis the Heroes and FeatureGrids prove: change only the declared data, get
// a new pricing section. Each tree declares an optional {it,en} heading, a fully declared billing
// config (monthly/annual/note labels, all {it,en}, so the language toggle exercises them too), and
// exactly 3 plans where the CENTER (non-first) plan is highlighted with a badge. Copy is
// placeholder, anchored strictly to CONTEXT.md's product pitches (the same three products as the
// Heroes), prices are fake, and the monthly/annual pair differs per plan.
const BILLING = {
  monthlyLabel: { it: "Mensile", en: "Monthly" },
  annualLabel: { it: "Annuale", en: "Annual" },
  perMonth: { it: "/mese", en: "/month" },
  perYear: { it: "/anno", en: "/year" },
  annualNote: { it: "Risparmia con l'annuale", en: "Save with annual billing" },
  groupLabel: { it: "Ciclo di fatturazione", en: "Billing cycle" },
}
const RECOMMENDED = { it: "Consigliato", en: "Recommended" }
const PRICING: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("Pricing", {
      eyebrow: { it: "Prezzi", en: "Pricing" },
      title: { it: "Comanda la tua flotta di agenti", en: "Command your fleet of agents" },
      subtitle: { it: "Agentico e MCP-first.", en: "Agentic and MCP-first." },
      billing: BILLING,
      plans: [
        {
          name: { it: "Solo", en: "Solo" },
          priceMonthly: "9 EUR",
          priceAnnual: "90 EUR",
          features: [
            { it: "Un agente", en: "One agent" },
            { it: "Connettori MCP di base", en: "Basic MCP connectors" },
          ],
          cta: { label: { it: "Inizia", en: "Get started" }, href: "#astrobot-solo" },
        },
        {
          name: { it: "Flotta", en: "Fleet" },
          priceMonthly: "29 EUR",
          priceAnnual: "290 EUR",
          highlighted: true,
          badge: RECOMMENDED,
          features: [
            { it: "Flotta di agenti", en: "Fleet of agents" },
            { it: "Tutti i connettori MCP", en: "All MCP connectors" },
            { it: "Flussi agentici", en: "Agentic workflows" },
          ],
          cta: { label: { it: "Inizia", en: "Get started" }, href: "#astrobot-fleet" },
        },
        {
          name: { it: "Enterprise", en: "Enterprise" },
          priceMonthly: "99 EUR",
          priceAnnual: "990 EUR",
          features: [
            { it: "Agenti illimitati", en: "Unlimited agents" },
            { it: "MCP self-hosted", en: "Self-hosted MCP" },
          ],
          cta: { label: { it: "Contattaci", en: "Contact us" }, href: "#astrobot-enterprise" },
        },
      ],
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("Pricing", {
      eyebrow: { it: "Prezzi", en: "Pricing" },
      title: { it: "Tutti i calendari e le email in un posto solo", en: "Every calendar and inbox in one place" },
      subtitle: { it: "Aggrega più calendari ed email, con trascrizione in chiamata.", en: "Aggregates multiple calendars and emails, with in-call transcription." },
      billing: BILLING,
      plans: [
        {
          name: { it: "Base", en: "Base" },
          priceMonthly: "5 EUR",
          priceAnnual: "50 EUR",
          features: [
            { it: "Un calendario", en: "One calendar" },
            { it: "Una casella email", en: "One inbox" },
          ],
          cta: { label: { it: "Inizia", en: "Get started" }, href: "#calendar-base" },
        },
        {
          name: { it: "Plus", en: "Plus" },
          priceMonthly: "12 EUR",
          priceAnnual: "120 EUR",
          highlighted: true,
          badge: RECOMMENDED,
          features: [
            { it: "Più calendari", en: "Multiple calendars" },
            { it: "Più caselle email", en: "Multiple inboxes" },
            { it: "Trascrizione in chiamata", en: "In-call transcription" },
          ],
          cta: { label: { it: "Inizia", en: "Get started" }, href: "#calendar-plus" },
        },
        {
          name: { it: "Team", en: "Team" },
          priceMonthly: "24 EUR",
          priceAnnual: "240 EUR",
          features: [
            { it: "Calendari del team", en: "Team calendars" },
            { it: "Trascrizioni condivise", en: "Shared transcriptions" },
          ],
          cta: { label: { it: "Contattaci", en: "Contact us" }, href: "#calendar-team" },
        },
      ],
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("Pricing", {
      eyebrow: { it: "Prezzi", en: "Pricing" },
      title: { it: "Parla con le persone su tanti canali, in un posto solo", en: "Talk to people across many channels, in one place" },
      subtitle: { it: "Un solo posto per tutti i tuoi canali.", en: "One place for all your channels." },
      billing: BILLING,
      plans: [
        {
          name: { it: "Base", en: "Base" },
          priceMonthly: "7 EUR",
          priceAnnual: "70 EUR",
          features: [
            { it: "Un canale", en: "One channel" },
            { it: "Un posto solo", en: "One place" },
          ],
          cta: { label: { it: "Inizia", en: "Get started" }, href: "#astro-base" },
        },
        {
          name: { it: "Pro", en: "Pro" },
          priceMonthly: "15 EUR",
          priceAnnual: "150 EUR",
          highlighted: true,
          badge: RECOMMENDED,
          features: [
            { it: "Tanti canali", en: "Many channels" },
            { it: "Tante conversazioni", en: "Many conversations" },
            { it: "Un posto solo", en: "One place" },
          ],
          cta: { label: { it: "Inizia", en: "Get started" }, href: "#astro-pro" },
        },
        {
          name: { it: "Business", en: "Business" },
          priceMonthly: "30 EUR",
          priceAnnual: "300 EUR",
          features: [
            { it: "Canali illimitati", en: "Unlimited channels" },
            { it: "Team condiviso", en: "Shared team" },
          ],
          cta: { label: { it: "Contattaci", en: "Contact us" }, href: "#astro-business" },
        },
      ],
    }),
  },
]

// FAQ demo declarations (phase 36 t5, C13). ONE FAQ component, three separate type:"FAQ" A2UI trees
// that differ ONLY in the declared {it,en} data — the same thesis the Heroes, FeatureGrids and
// Pricings prove: change only the declared prose, get a new FAQ section. Each tree declares an
// optional {it,en} heading plus items[] of { question:{it,en}, answer:{it,en} }. Answers are long
// enough to prove no overflow when expanded on the narrow accordion (C10). Copy is placeholder,
// anchored strictly to CONTEXT.md's product pitches (the same three products as the Heroes), NOT
// embellished beyond them.
const FAQS: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("FAQ", {
      eyebrow: { it: "Domande frequenti", en: "FAQ" },
      title: { it: "Comanda la tua flotta di agenti", en: "Command your fleet of agents" },
      subtitle: { it: "Agentico e MCP-first.", en: "Agentic and MCP-first." },
      items: [
        {
          question: { it: "Che cos'è astrobot?", en: "What is astrobot?" },
          answer: { it: "astrobot è agentico e MCP-first: comandi la tua flotta di agenti da un posto solo, e ogni agente lavora per te.", en: "astrobot is agentic and MCP-first: you command your fleet of agents from one place, and each agent works on your behalf." },
        },
        {
          question: { it: "Che cosa vuol dire MCP-first?", en: "What does MCP-first mean?" },
          answer: { it: "MCP-first vuol dire che colleghi i tuoi strumenti via MCP, così gli agenti usano ciò che già hai senza integrazioni su misura.", en: "MCP-first means you connect your tools over MCP, so the agents use what you already have with no bespoke integrations." },
        },
        {
          question: { it: "Posso comandare più agenti?", en: "Can I command many agents?" },
          answer: { it: "Sì: comandi più agenti da un posto solo, e la flotta lavora per te mentre tu segui il quadro d'insieme.", en: "Yes: you command many agents from one place, and the fleet works on your behalf while you watch the whole picture." },
        },
      ],
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("FAQ", {
      eyebrow: { it: "Domande frequenti", en: "FAQ" },
      title: { it: "Tutti i calendari e le email in un posto solo", en: "Every calendar and inbox in one place" },
      subtitle: { it: "Aggrega più calendari ed email, con trascrizione in chiamata.", en: "Aggregates multiple calendars and emails, with in-call transcription." },
      items: [
        {
          question: { it: "Quali calendari posso aggregare?", en: "Which calendars can I aggregate?" },
          answer: { it: "Aggreghi più calendari in una sola vista, così vedi tutti i tuoi impegni in un posto solo senza saltare tra le app.", en: "You aggregate multiple calendars into a single view, so you see all your commitments in one place without jumping between apps." },
        },
        {
          question: { it: "E le email?", en: "What about email?" },
          answer: { it: "Aggreghi anche più caselle email in un posto solo, accanto ai tuoi calendari, così gestisci impegni e messaggi insieme.", en: "You also aggregate multiple inboxes into one place, next to your calendars, so you handle commitments and messages together." },
        },
        {
          question: { it: "Come funziona la trascrizione in chiamata?", en: "How does in-call transcription work?" },
          answer: { it: "La trascrizione in chiamata trascrive le tue chiamate mentre parli, così resta il testo di ciò che è stato detto accanto all'evento del calendario.", en: "In-call transcription transcribes your calls while you talk, so the text of what was said stays next to the calendar event." },
        },
      ],
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("FAQ", {
      eyebrow: { it: "Domande frequenti", en: "FAQ" },
      title: { it: "Parla con le persone su tanti canali, in un posto solo", en: "Talk to people across many channels, in one place" },
      subtitle: { it: "Un solo posto per tutti i tuoi canali.", en: "One place for all your channels." },
      items: [
        {
          question: { it: "Che cos'è Astro?", en: "What is Astro?" },
          answer: { it: "Astro è un solo posto per tutti i tuoi canali: parli con le persone su tanti canali senza cambiare app a ogni conversazione.", en: "Astro is one place for all your channels: you talk to people across many channels without switching apps for each conversation." },
        },
        {
          question: { it: "Quali canali posso collegare?", en: "Which channels can I connect?" },
          answer: { it: "Astro aggrega i canali che già usi, così tutte le tue conversazioni arrivano in un posto solo invece di essere sparse.", en: "Astro aggregates the channels you already use, so all your conversations land in one place instead of being scattered." },
        },
        {
          question: { it: "Posso seguire tante conversazioni insieme?", en: "Can I follow many conversations at once?" },
          answer: { it: "Sì: segui tante conversazioni su tanti canali da un posto solo, senza perdere il filo passando da un'app all'altra.", en: "Yes: you follow many conversations across many channels from one place, without losing the thread by hopping between apps." },
        },
      ],
    }),
  },
]

// CTASection demo declarations (phase 37 t4, C11). ONE CTASection component, three separate
// type:"CTASection" A2UI trees that differ ONLY in the declared {it,en} data — the same thesis the
// Heroes, FeatureGrids, Pricings and FAQs prove: change only the declared prose, get a new closing
// call-to-action band. Each tree declares eyebrow + title + subtitle + primaryCta + secondaryCta,
// so every field is exercised by the language toggle. The Astro tree pairs its long title with a
// deliberately longer secondaryCta label ("Scopri come funziona") to stress the narrow full-width
// CTAs against overflow (C8). Copy is placeholder, anchored strictly to CONTEXT.md's product
// pitches (the same three products as the Heroes), NOT embellished beyond them.
const CTAS: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("CTASection", {
      eyebrow: { it: "Agentico · MCP-first", en: "Agentic · MCP-first" },
      title: { it: "Comanda la tua flotta di agenti", en: "Command your fleet of agents" },
      subtitle: { it: "Agentico e MCP-first.", en: "Agentic and MCP-first." },
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#astrobot" },
      secondaryCta: { label: { it: "Scopri di più", en: "Learn more" }, href: "#astrobot-more" },
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("CTASection", {
      eyebrow: { it: "Astro Calendar", en: "Astro Calendar" },
      title: { it: "Tutti i calendari e le email in un posto solo", en: "Every calendar and inbox in one place" },
      subtitle: { it: "Aggrega più calendari ed email, con trascrizione in chiamata.", en: "Aggregates multiple calendars and emails, with in-call transcription." },
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#calendar" },
      secondaryCta: { label: { it: "Scopri di più", en: "Learn more" }, href: "#calendar-more" },
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("CTASection", {
      eyebrow: { it: "Astro", en: "Astro" },
      title: { it: "Parla con le persone su tanti canali, in un posto solo", en: "Talk to people across many channels, in one place" },
      subtitle: { it: "Un solo posto per tutti i tuoi canali.", en: "One place for all your channels." },
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#astro" },
      secondaryCta: { label: { it: "Scopri come funziona", en: "See how it works" }, href: "#astro-more" },
    }),
  },
]

// MarketingNav demo declarations (phase 38 t4, C9/C14). ONE MarketingNav component, three separate
// type:"MarketingNav" A2UI trees that differ ONLY in the declared {it,en} data — the same thesis the
// Heroes, FeatureGrids, Pricings, FAQs and CTASections prove: change only the declared data, get a
// new top navigation bar. Each tree declares brand (with a brandIcon from the curated enum), 3-4
// links, a required primaryCta and an optional secondaryCta, all {it,en}, so the language toggle
// exercises every string in both the desktop bar and the mobile drawer. The Astro tree pairs its
// long product wording with a deliberately longer link label ("Come funziona") to stress the sticky
// bar and the open drawer against overflow (C11). Copy is placeholder, anchored strictly to
// CONTEXT.md's product pitches (the same three products as the Heroes), NOT embellished beyond them.
const NAVS: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("MarketingNav", {
      brand: { name: { it: "astrobot", en: "astrobot" }, brandIcon: "bot" },
      links: [
        { label: { it: "Funzioni", en: "Features" }, href: "#astrobot-features" },
        { label: { it: "Prezzi", en: "Pricing" }, href: "#astrobot-pricing" },
        { label: { it: "FAQ", en: "FAQ" }, href: "#astrobot-faq" },
      ],
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#astrobot" },
      secondaryCta: { label: { it: "Accedi", en: "Sign in" }, href: "#astrobot-login" },
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("MarketingNav", {
      brand: { name: { it: "Astro Calendar", en: "Astro Calendar" }, brandIcon: "calendar" },
      links: [
        { label: { it: "Funzioni", en: "Features" }, href: "#calendar-features" },
        { label: { it: "Prezzi", en: "Pricing" }, href: "#calendar-pricing" },
        { label: { it: "FAQ", en: "FAQ" }, href: "#calendar-faq" },
      ],
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#calendar" },
      secondaryCta: { label: { it: "Accedi", en: "Sign in" }, href: "#calendar-login" },
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("MarketingNav", {
      brand: { name: { it: "Astro", en: "Astro" }, brandIcon: "layers" },
      links: [
        { label: { it: "Funzioni", en: "Features" }, href: "#astro-features" },
        { label: { it: "Prezzi", en: "Pricing" }, href: "#astro-pricing" },
        { label: { it: "Come funziona", en: "How it works" }, href: "#astro-how" },
        { label: { it: "FAQ", en: "FAQ" }, href: "#astro-faq" },
      ],
      primaryCta: { label: { it: "Inizia", en: "Get started" }, href: "#astro" },
      secondaryCta: { label: { it: "Accedi", en: "Sign in" }, href: "#astro-login" },
    }),
  },
]

// Footer demo declarations (phase 39 t4, C13). ONE Footer component, three separate type:"Footer"
// A2UI trees that differ ONLY in the declared {it,en} data — the same thesis the Heroes,
// FeatureGrids, Pricings, FAQs, CTASections and MarketingNavs prove: change only the declared data,
// get a new site footer. Each tree declares brand (with a brandIcon from the curated enum + a
// tagline), 2-3 columns each with a heading + 2-4 links, a social[] of 2-3 entries using the new
// social icon name-tokens (each with an {it,en} label), and bottom (copyright {it,en} + 2
// legalLinks: Privacy / Termini), all {it,en}, so the language toggle exercises every string in both
// the wide grid and the narrow accordion. The Astro tree pairs its long product wording with a
// deliberately long heading, link label and copyright to stress the accordion + bottom bar against
// overflow when expanded (C7). Copy is placeholder, anchored strictly to CONTEXT.md's product
// pitches (the same three products as the Heroes), NOT embellished beyond them.
const FOOTERS: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("Footer", {
      brand: {
        name: { it: "astrobot", en: "astrobot" },
        brandIcon: "bot",
        tagline: { it: "Agentico e MCP-first.", en: "Agentic and MCP-first." },
      },
      columns: [
        {
          heading: { it: "Prodotto", en: "Product" },
          links: [
            { label: { it: "Funzioni", en: "Features" }, href: "#astrobot-features" },
            { label: { it: "Prezzi", en: "Pricing" }, href: "#astrobot-pricing" },
            { label: { it: "FAQ", en: "FAQ" }, href: "#astrobot-faq" },
          ],
        },
        {
          heading: { it: "Risorse", en: "Resources" },
          links: [
            { label: { it: "Documentazione", en: "Documentation" }, href: "#astrobot-docs" },
            { label: { it: "Connettori MCP", en: "MCP connectors" }, href: "#astrobot-mcp" },
          ],
        },
        {
          heading: { it: "Azienda", en: "Company" },
          links: [
            { label: { it: "Chi siamo", en: "About" }, href: "#astrobot-about" },
            { label: { it: "Contatti", en: "Contact" }, href: "#astrobot-contact" },
          ],
        },
      ],
      social: [
        { icon: "at-sign", href: "#astrobot-email", label: { it: "Email", en: "Email" } },
        { icon: "hash", href: "#astrobot-community", label: { it: "Community", en: "Community" } },
        { icon: "rss", href: "#astrobot-blog", label: { it: "Blog", en: "Blog" } },
      ],
      bottom: {
        copyright: { it: "© 2026 astrobot. Tutti i diritti riservati.", en: "© 2026 astrobot. All rights reserved." },
        legalLinks: [
          { label: { it: "Privacy", en: "Privacy" }, href: "#astrobot-privacy" },
          { label: { it: "Termini", en: "Terms" }, href: "#astrobot-terms" },
        ],
      },
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("Footer", {
      brand: {
        name: { it: "Astro Calendar", en: "Astro Calendar" },
        brandIcon: "calendar",
        tagline: { it: "Tutti i calendari e le email in un posto solo.", en: "Every calendar and inbox in one place." },
      },
      columns: [
        {
          heading: { it: "Prodotto", en: "Product" },
          links: [
            { label: { it: "Funzioni", en: "Features" }, href: "#calendar-features" },
            { label: { it: "Prezzi", en: "Pricing" }, href: "#calendar-pricing" },
            { label: { it: "FAQ", en: "FAQ" }, href: "#calendar-faq" },
          ],
        },
        {
          heading: { it: "Risorse", en: "Resources" },
          links: [
            { label: { it: "Documentazione", en: "Documentation" }, href: "#calendar-docs" },
            { label: { it: "Trascrizione in chiamata", en: "In-call transcription" }, href: "#calendar-transcription" },
          ],
        },
        {
          heading: { it: "Azienda", en: "Company" },
          links: [
            { label: { it: "Chi siamo", en: "About" }, href: "#calendar-about" },
            { label: { it: "Contatti", en: "Contact" }, href: "#calendar-contact" },
          ],
        },
      ],
      social: [
        { icon: "at-sign", href: "#calendar-email", label: { it: "Email", en: "Email" } },
        { icon: "send", href: "#calendar-updates", label: { it: "Aggiornamenti", en: "Updates" } },
      ],
      bottom: {
        copyright: { it: "© 2026 Astro Calendar. Tutti i diritti riservati.", en: "© 2026 Astro Calendar. All rights reserved." },
        legalLinks: [
          { label: { it: "Privacy", en: "Privacy" }, href: "#calendar-privacy" },
          { label: { it: "Termini", en: "Terms" }, href: "#calendar-terms" },
        ],
      },
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("Footer", {
      brand: {
        name: { it: "Astro", en: "Astro" },
        brandIcon: "layers",
        tagline: { it: "Parla con le persone su tanti canali, in un posto solo.", en: "Talk to people across many channels, in one place." },
      },
      columns: [
        {
          heading: { it: "Prodotto e integrazioni con i canali", en: "Product and channel integrations" },
          links: [
            { label: { it: "Parla con le persone su tanti canali", en: "Talk to people across many channels" }, href: "#astro-channels" },
            { label: { it: "Prezzi", en: "Pricing" }, href: "#astro-pricing" },
            { label: { it: "Come funziona", en: "How it works" }, href: "#astro-how" },
          ],
        },
        {
          heading: { it: "Risorse", en: "Resources" },
          links: [
            { label: { it: "Documentazione", en: "Documentation" }, href: "#astro-docs" },
            { label: { it: "Canali supportati", en: "Supported channels" }, href: "#astro-supported" },
          ],
        },
        {
          heading: { it: "Azienda", en: "Company" },
          links: [
            { label: { it: "Chi siamo", en: "About" }, href: "#astro-about" },
            { label: { it: "Contatti", en: "Contact" }, href: "#astro-contact" },
          ],
        },
      ],
      social: [
        { icon: "at-sign", href: "#astro-email", label: { it: "Email", en: "Email" } },
        { icon: "hash", href: "#astro-community", label: { it: "Community", en: "Community" } },
        { icon: "link", href: "#astro-links", label: { it: "Collegamenti", en: "Links" } },
      ],
      bottom: {
        copyright: { it: "© 2026 Astro. Un solo posto per tutti i tuoi canali. Tutti i diritti riservati.", en: "© 2026 Astro. One place for all your channels. All rights reserved." },
        legalLinks: [
          { label: { it: "Privacy", en: "Privacy" }, href: "#astro-privacy" },
          { label: { it: "Termini", en: "Terms" }, href: "#astro-terms" },
        ],
      },
    }),
  },
]

// Testimonials demo declarations (phase 40 t4, C16). ONE Testimonials component, three separate
// type:"Testimonials" A2UI trees that differ ONLY in the declared {it,en} data (and the plain,
// untranslated author names) — the same thesis the Heroes, FeatureGrids, Pricings, FAQs, CTASections,
// MarketingNavs and Footers prove: change only the declared data, get a new social-proof block. Each
// tree declares an optional {it,en} heading (eyebrow/title/subtitle), a {it,en} ratingLabel template
// with a {n} placeholder (so the language toggle exercises the star label too), and 3-4 items. Each
// item mixes an author (plain name + {it,en} role), a quote {it,en}, and — to exercise the avatar
// paths — SOME items carry an avatar with only an {it,en} alt (no src, so the initials fallback shows,
// C5) and SOME carry no avatar at all; ratings mix 5 / 4 / 3 with at least one item left unrated
// (C3b/C6). The Astro Calendar tree pairs its long product wording with a deliberately long quote,
// role and author name to stress the carousel + grid against overflow (C8). Copy is placeholder,
// anchored strictly to CONTEXT.md's product pitches (the same three products as the Heroes), NOT
// embellished beyond them.
const TESTIMONIALS: { key: string; label: string; tree: A2uiTree }[] = [
  {
    key: "astrobot",
    label: "astrobot",
    tree: one("Testimonials", {
      eyebrow: { it: "Dicono di noi", en: "What people say" },
      title: { it: "Comanda la tua flotta di agenti", en: "Command your fleet of agents" },
      subtitle: { it: "Agentico e MCP-first.", en: "Agentic and MCP-first." },
      ratingLabel: { it: "{n} su 5", en: "{n} out of 5" },
      items: [
        {
          quote: { it: "Comando più agenti da un posto solo e la flotta lavora per me.", en: "I command many agents from one place and the fleet works on my behalf." },
          author: { name: "Marco Riva", role: { it: "Fondatore", en: "Founder" } },
          avatar: { alt: { it: "Foto di Marco Riva", en: "Photo of Marco Riva" } },
          rating: 5,
        },
        {
          quote: { it: "MCP-first vuol dire che collego i miei strumenti senza integrazioni su misura.", en: "MCP-first means I connect my tools with no bespoke integrations." },
          author: { name: "Elena Costa", role: { it: "Responsabile di prodotto", en: "Head of Product" } },
          rating: 4,
        },
        {
          quote: { it: "Agentico davvero: gli agenti lavorano per me mentre seguo il quadro d'insieme.", en: "Truly agentic: the agents work on my behalf while I watch the whole picture." },
          author: { name: "Davide Sala", role: { it: "Ingegnere", en: "Engineer" } },
          avatar: { alt: { it: "Foto di Davide Sala", en: "Photo of Davide Sala" } },
        },
      ],
    }),
  },
  {
    key: "astro-calendar",
    label: "Astro Calendar",
    tree: one("Testimonials", {
      eyebrow: { it: "Dicono di noi", en: "What people say" },
      title: { it: "Tutti i calendari e le email in un posto solo", en: "Every calendar and inbox in one place" },
      subtitle: { it: "Aggrega più calendari ed email, con trascrizione in chiamata.", en: "Aggregates multiple calendars and emails, with in-call transcription." },
      ratingLabel: { it: "{n} su 5", en: "{n} out of 5" },
      items: [
        {
          quote: { it: "Aggrego più calendari ed email in una sola vista, e la trascrizione in chiamata tiene il testo di ogni riunione accanto all'evento del calendario, così non perdo mai il filo di quello che è stato detto.", en: "I aggregate multiple calendars and inboxes into a single view, and in-call transcription keeps the text of every meeting next to the calendar event, so I never lose track of what was said." },
          author: { name: "Alessandra Bellincampi Ferretti", role: { it: "Responsabile delle operazioni e della pianificazione", en: "Head of operations and scheduling" } },
          avatar: { alt: { it: "Foto di Alessandra Bellincampi Ferretti", en: "Photo of Alessandra Bellincampi Ferretti" } },
          rating: 5,
        },
        {
          quote: { it: "Vedo tutti i miei impegni in un posto solo senza saltare tra le app.", en: "I see all my commitments in one place without jumping between apps." },
          author: { name: "Giulia Moro", role: { it: "Assistente", en: "Assistant" } },
          rating: 3,
        },
        {
          quote: { it: "Le email stanno accanto ai calendari, così gestisco impegni e messaggi insieme.", en: "The inboxes sit next to the calendars, so I handle commitments and messages together." },
          author: { name: "Paolo Neri", role: { it: "Consulente", en: "Consultant" } },
          avatar: { alt: { it: "Foto di Paolo Neri", en: "Photo of Paolo Neri" } },
          rating: 4,
        },
        {
          quote: { it: "La trascrizione in chiamata trascrive mentre parlo.", en: "In-call transcription transcribes while I talk." },
          author: { name: "Sara Vitale", role: { it: "Project manager", en: "Project manager" } },
        },
      ],
    }),
  },
  {
    key: "astro",
    label: "Astro",
    tree: one("Testimonials", {
      eyebrow: { it: "Dicono di noi", en: "What people say" },
      title: { it: "Parla con le persone su tanti canali, in un posto solo", en: "Talk to people across many channels, in one place" },
      subtitle: { it: "Un solo posto per tutti i tuoi canali.", en: "One place for all your channels." },
      ratingLabel: { it: "{n} su 5", en: "{n} out of 5" },
      items: [
        {
          quote: { it: "Parlo con le persone su tanti canali senza cambiare app a ogni conversazione.", en: "I talk to people across many channels without switching apps for each conversation." },
          author: { name: "Luca Ferrari", role: { it: "Titolare", en: "Owner" } },
          avatar: { alt: { it: "Foto di Luca Ferrari", en: "Photo of Luca Ferrari" } },
          rating: 5,
        },
        {
          quote: { it: "Astro aggrega i canali che già uso, così le conversazioni arrivano in un posto solo.", en: "Astro aggregates the channels I already use, so conversations land in one place." },
          author: { name: "Chiara Greco", role: { it: "Responsabile assistenza", en: "Support lead" } },
          rating: 4,
        },
        {
          quote: { it: "Seguo tante conversazioni insieme senza perdere il filo.", en: "I follow many conversations at once without losing the thread." },
          author: { name: "Matteo Bruno", role: { it: "Community manager", en: "Community manager" } },
          avatar: { alt: { it: "Foto di Matteo Bruno", en: "Photo of Matteo Bruno" } },
          rating: 3,
        },
      ],
    }),
  },
]

// Example landing (phase 33 demo, composition — NOT a new component/contract). The five marketing
// components stacked into one page. Order = MarketingNav → Hero → FeatureGrid → Pricing → FAQ →
// CTASection, the natural top-to-bottom reading of a real product page: the nav sits at the top,
// reusing the astrobot NAVS[0] tree (composition only, no new contract). The isolated demos each carry
// the full product headline (so each surface stands alone), but a real page must NOT repeat the same
// heading in every band. So the landing reuses the exact astrobot BODY data (feature items, pricing
// billing + plans, faq items, cta button labels/hrefs) while giving each section its own
// purpose-specific heading. The product headline "Comanda la tua flotta di agenti" lives in exactly
// ONE place here: the Hero. Rendered through the SAME pipeline, full-width, as a real page stacks them.
// The astrobot Footer (FOOTERS[0]) sits at the very bottom (phase 39 t4), so the page now has
// nav-on-top + the five body sections + footer-at-bottom: a full page frame, composition only.
const LANDING_ASTROBOT: { key: string; tree: A2uiTree }[] = [
  { key: "nav", tree: NAVS[0].tree },
  { key: "hero", tree: HEROES[0].tree },
  {
    key: "features",
    tree: one("FeatureGrid", {
      eyebrow: { it: "Funzioni", en: "Features" },
      title: { it: "Tutto per comandare gli agenti", en: "Everything to command your agents" },
      subtitle: { it: "Dai connettori ai flussi, in un posto solo.", en: "From connectors to flows, in one place." },
      items: FEATURES[0].tree.nodes[0].props.items,
    }),
  },
  {
    key: "pricing",
    tree: one("Pricing", {
      eyebrow: { it: "Prezzi", en: "Pricing" },
      title: { it: "Prezzi semplici", en: "Simple pricing" },
      subtitle: { it: "Scegli il piano per la tua flotta.", en: "Pick the plan for your fleet." },
      billing: PRICING[0].tree.nodes[0].props.billing,
      plans: PRICING[0].tree.nodes[0].props.plans,
    }),
  },
  {
    key: "faq",
    tree: one("FAQ", {
      eyebrow: { it: "FAQ", en: "FAQ" },
      title: { it: "Domande frequenti", en: "Frequently asked questions" },
      items: FAQS[0].tree.nodes[0].props.items,
    }),
  },
  {
    key: "cta",
    tree: one("CTASection", {
      title: { it: "Pronto a comandare la tua flotta?", en: "Ready to command your fleet?" },
      subtitle: { it: "Attiva astrobot in pochi minuti.", en: "Get astrobot running in minutes." },
      primaryCta: CTAS[0].tree.nodes[0].props.primaryCta,
      secondaryCta: CTAS[0].tree.nodes[0].props.secondaryCta,
    }),
  },
  { key: "footer", tree: FOOTERS[0].tree },
]

function Lab() {
  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    try { return localStorage.getItem("astrochat.mode") === "light" ? "light" : "dark" } catch { return "dark" }
  })
  const [accent, setAccent] = React.useState<Accent>(() => {
    try { const a = localStorage.getItem("astrochat.acc")?.split(","); return ACCENTS.find((x) => a && String(x.h) === a[0]) ?? ACCENTS[0] } catch { return ACCENTS[0] }
  })
  // Language toggle (default "it"), honoring a ?lang=it|en URL param as the initial value.
  const [lang, setLang] = React.useState<Lang>(() => {
    try { return new URLSearchParams(location.search).get("lang") === "en" ? "en" : "it" } catch { return "it" }
  })
  // Viewport preview: because Hero uses a container query, a 360px frame shows its real mobile
  // view without resizing the window; "desktop" lets it fill the column and go side-by-side.
  const [viewport, setViewport] = React.useState<"mobile" | "desktop">("desktop")
  React.useEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(accent.h))
    r.style.setProperty("--acc-c", String(accent.c))
    try { localStorage.setItem("astrochat.mode", theme); localStorage.setItem("astrochat.acc", `${accent.h},${accent.c}`) } catch { /* ignore */ }
  }, [theme, accent])

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* top bar (host chrome) */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-[var(--panel)]/95 px-6 py-3 backdrop-blur">
        <div className="flex items-baseline gap-3">
          <span className="text-[15px] font-semibold tracking-[-.01em]">astro-ui · lab</span>
          <span className="font-mono text-[11px] text-faint">every demo is a declared tree through the real renderer</span>
        </div>
        <div className="flex items-center gap-3">
          {/* language toggle (host chrome) — drives LangProvider around the Hero trees */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5" role="group" aria-label="Interface language">
            {(["it", "en"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={l === lang} aria-label={l === "it" ? "Italiano" : "English"}
                className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase ${l === lang ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {ACCENTS.map((a) => (
              <button key={a.id} title={a.name} aria-label={a.name} aria-pressed={a.id === accent.id} onClick={() => setAccent(a)}
                className="size-[18px] rounded-full" style={{ background: `oklch(0.66 ${a.c} ${a.h})`, color: `oklch(0.66 ${a.c} ${a.h})`, boxShadow: a.id === accent.id ? "0 0 0 2px var(--background), 0 0 0 3.5px currentColor" : "inset 0 0 0 1px rgba(255,255,255,.2)" }} />
            ))}
          </div>
          <button onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))} aria-label="Toggle theme"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
            {theme === "dark" ? ThemeIcon.sun : ThemeIcon.moon}
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-8">
        <p className="max-w-[70ch] text-[13px] text-muted-foreground">
          13 catalog components, each a single use extended by props. The bases in isolation, then
          contextualized compositions where several combine. Flip the accent / theme above — the
          whole catalogue re-themes because every colour is a token.
        </p>

        {/* Marketing tier — Hero (phase 33). Three declared trees, one component; the language,
            accent, viewport and theme toggles above all drive it live. */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · Hero</h2>
            <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5" role="group" aria-label="Viewport preview">
              {(["mobile", "desktop"] as const).map((v) => (
                <button key={v} onClick={() => setViewport(v)} aria-pressed={v === viewport}
                  className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold capitalize ${v === viewport ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {HEROES.map((h) => (
                <Stage key={h.key} label={h.label} note="declared Hero tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={h.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — FeatureGrid (phase 34). Three declared trees, one component; the same
            language, accent, viewport and theme toggles above drive it live. The viewport frame lets
            the @container query flip each item between its icon-left row and its icon-above card. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · FeatureGrid</h2>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {FEATURES.map((f) => (
                <Stage key={f.key} label={f.label} note="declared FeatureGrid tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={f.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — Pricing (phase 35). Three declared trees, one component; the same
            language, accent, viewport and theme toggles above drive it live, plus the in-component
            billing toggle. The viewport frame lets the @container query flip the highlighted plan
            between its center-lifted desktop position and its top-of-stack narrow position. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · Pricing</h2>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {PRICING.map((p) => (
                <Stage key={p.key} label={p.label} note="declared Pricing tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={p.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — FAQ (phase 36). Three declared trees, one component; the same language,
            accent, viewport and theme toggles above drive it live. The viewport frame lets the
            @container query flip each FAQ between its narrow single-column collapsible accordion
            (interactive on the mobile preview) and its wide 2-column always-open grid. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · FAQ</h2>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {FAQS.map((q) => (
                <Stage key={q.key} label={q.label} note="declared FAQ tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={q.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — CTASection (phase 37). Three declared trees, one component; the same
            language, accent, viewport and theme toggles above drive it live. The viewport frame lets
            the @container query flip the band between its narrow stacked-centered view (full-width
            CTAs below the text) and its wide left-text / right-CTAs horizontal split. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · CTASection</h2>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {CTAS.map((c) => (
                <Stage key={c.key} label={c.label} note="declared CTASection tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={c.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — MarketingNav (phase 38). Three declared trees, one component; the same
            language, accent, viewport and theme toggles above drive it live. The viewport frame lets
            the @container query flip the bar between its wide inline-links view and its narrow
            hamburger view, and in the mobile preview the hamburger opens the Radix Dialog drawer with
            the stacked links + both CTAs. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · MarketingNav</h2>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {NAVS.map((n) => (
                <Stage key={n.key} label={n.label} note="declared MarketingNav tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={n.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — Footer (phase 39). Three declared trees, one component; the same
            language, accent, viewport and theme toggles above drive it live. The viewport frame lets
            the @container query flip the footer between its narrow single-column collapsible
            accordion columns (interactive on the mobile preview) and its wide brand-beside-grid
            always-open multi-column layout. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · Footer</h2>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {FOOTERS.map((f) => (
                <Stage key={f.key} label={f.label} note="declared Footer tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={f.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — Testimonials (phase 40). Three declared trees, one component; the same
            language, accent, viewport and theme toggles above drive it live. The viewport frame lets
            the @container query flip the block between its narrow horizontal scroll-snap carousel
            (scrollable one card at a time on the mobile preview) and its wide always-visible
            multi-column grid. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · Testimonials</h2>
          <LangProvider value={lang}>
            <div className="flex flex-col gap-4">
              {TESTIMONIALS.map((t) => (
                <Stage key={t.key} label={t.label} note="declared Testimonials tree · same component, data-only diff">
                  <div
                    style={viewport === "mobile" ? { width: 360 } : undefined}
                    className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
                  >
                    <Demo t={t.tree} />
                  </div>
                </Stage>
              ))}
            </div>
          </LangProvider>
        </section>

        {/* Marketing tier — Landing (phase 33 demo). The five astrobot marketing components stacked
            in order (Hero → FeatureGrid → Pricing → FAQ → CTASection) as one real full-width page,
            each a full-bleed section in natural vertical flow. These are the SAME declared trees as
            the per-component demos above (index 0 of each), reused here — so the language, accent,
            viewport and theme toggles above drive the whole page live, and nothing drifts from the
            isolated demos. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-foreground">Marketing · Landing (astrobot)</h2>
          <LangProvider value={lang}>
            <Stage label="astrobot" note="Hero → FeatureGrid → Pricing → FAQ → CTASection · five declared trees, one page">
              <div
                style={viewport === "mobile" ? { width: 360 } : undefined}
                className={`overflow-hidden rounded-xl border border-border ${viewport === "mobile" ? "mx-auto" : ""}`}
              >
                {LANDING_ASTROBOT.map((s) => (
                  <Demo key={s.key} t={s.tree} />
                ))}
              </div>
            </Stage>
          </LangProvider>
        </section>

        <Section title="Primitives">
          <Stage label="Avatar" note="size · channel badge · presence">
            <Demo t={strip("row", [
              { type: "Avatar", props: { alt: "Mara Okafor", hue: 16, size: "xl", channel: "wa" } },
              { type: "Avatar", props: { alt: "Luca Bianchi", hue: 205, size: "md", channel: "tg" } },
              { type: "Avatar", props: { alt: "Priya Nair", hue: 330, size: "sm", presence: "online" } },
              { type: "Avatar", props: { alt: "Dana K", hue: 150, size: "xs" } },
            ])} />
          </Stage>

          <Stage label="Chip" note="neutral · accent · channel · link">
            <Demo t={strip("row", [
              { type: "Chip", props: { label: "Neutral" } },
              { type: "Chip", props: { label: "Launch", tone: "accent" } },
              { type: "Chip", props: { label: "WhatsApp", channelKey: "wa" } },
              { type: "Chip", props: { label: "open ref", open: "https://x.com" } },
            ], 8)} />
          </Stage>

          <Stage label="ThreadMarker" note="date · time · label">
            <Demo t={strip("column", [
              { type: "ThreadMarker", props: { label: "Today", kind: "date" } },
              { type: "ThreadMarker", props: { label: "9:14 AM", kind: "time" } },
              { type: "ThreadMarker", props: { label: "launch-room · 6 members", kind: "label" } },
            ], 6)} />
          </Stage>

          <Stage label="RichText" note="links + @mentions · trust">
            <Demo t={strip("column", [
              { type: "RichText", props: { text: LINK } },
              { type: "RichText", props: { text: "Peer (untrusted): [same link](https://x.com) is inert", trust: "peer" } },
            ], 8)} />
          </Stage>

          <Stage label="Attachment" note="image · card · chip · gone">
            <Demo t={strip("column", [
              { type: "Attachment", props: { kind: "file", name: "Launch-deck-v4.pdf", meta: "4.2 MB", variant: "card" } },
              { type: "Attachment", props: { kind: "file", name: "notes.txt", meta: "3 KB", variant: "chip" } },
              { type: "Attachment", props: { kind: "image", name: "old.png", gone: true } },
            ], 8)} />
          </Stage>

          <Stage label="ChannelButton" note="active · badge">
            <Demo t={strip("row", [
              { type: "ChannelButton", props: { channelKey: "all", badge: 5, active: true } },
              { type: "ChannelButton", props: { channelKey: "wa", badge: 2 } },
              { type: "ChannelButton", props: { channelKey: "tg" } },
              { type: "ChannelButton", props: { channelKey: "slack", badge: 3 } },
            ], 6)} />
          </Stage>

          <Stage label="AlertBanner" note="info · warn · dismissible">
            <Demo t={strip("column", [
              { type: "AlertBanner", props: { tone: "info", title: "History synced", detail: "The last 30 days are now searchable." } },
              { type: "AlertBanner", props: { tone: "warn", title: "Telegram disconnected", detail: "Reconnect to keep receiving.", dismissible: true } },
            ], 8)} />
          </Stage>

          <Stage label="Composer" note="input bar">
            <Demo t={one("Composer", { placeholder: "Message Mara…" })} />
          </Stage>
        </Section>

        <Section title="Inputs">
          <Stage label="SearchField" note="plain · find (counter)">
            <Demo t={strip("column", [
              { type: "SearchField", props: { placeholder: "Search people, messages…", shortcut: "⌘K" } },
              { type: "SearchField", props: { placeholder: "Find in conversation", count: 8, index: 3 } },
            ], 8)} />
          </Stage>
          <Stage label="ChipInput" note="token field (recipients)">
            <Demo t={one("ChipInput", { label: "To", chips: ["mara@northwind.co", "luca@studio.it"], placeholder: "Add recipient…" })} />
          </Stage>
        </Section>

        <Section title="Rows & sections">
          <Stage label="ConversationItem — row" note="selected · unread · group" frame="[&>*]:max-w-[300px]">
            <Demo t={strip("column", [
              { type: "ConversationItem", props: { name: "Mara Okafor", channelKey: "wa", preview: "Perfect — sending now.", time: "09:20", hue: 16, selected: true } },
              { type: "ConversationItem", props: { name: "Luca Bianchi", channelKey: "tg", preview: "Te lo mando oggi.", time: "11:06", unread: 2, hue: 205 } },
              { type: "ConversationItem", props: { name: "launch-room", channelKey: "slack", preview: "Dana: On it 👍", time: "08:46", unread: 3, hue: 280, group: true } },
            ], 2)} />
          </Stage>

          <Stage label="ListSection" note="collapsible group + rows" frame="[&>*]:max-w-[300px]">
            <Demo t={tree([
              { id: "root", type: "ListSection", props: P({ label: "Direct messages", count: 2 }), childrenIds: ["r1", "r2"] },
              { id: "r1", type: "ConversationItem", props: P({ name: "Mara Okafor", channelKey: "wa", preview: "Perfect — sending now.", time: "09:20", hue: 16 }) },
              { id: "r2", type: "ConversationItem", props: P({ name: "Priya Nair", channelKey: "mail", preview: "Let's find time next week.", time: "Tue", hue: 330 }) },
            ])} />
          </Stage>
        </Section>

        <Section title="MessageBubble — every state">
          <Stage label="MessageBubble" note="in · out · group · @you · reactions · quote">
            <div className="flex flex-col gap-2">
              <Demo t={one("MessageBubble", { direction: "in", text: "A plain inbound message." })} />
              <Demo t={one("MessageBubble", { direction: "out", text: "A plain outbound message." })} />
              <Demo t={one("MessageBubble", { direction: "in", sender: "Dana", senderHue: 150, text: "A group message with a coloured sender." })} />
              <Demo t={one("MessageBubble", { direction: "in", text: LINK, mentionsMe: true, reactions: [{ emoji: "👍", count: 2, who: ["You", "Tom"], self: true }, { emoji: "🔥" }], actions: ["reply", "react", "forward"] })} />
              <Demo t={one("MessageBubble", { direction: "in", text: "Agreed — redo pricing first?", quoted: { label: "You", excerpt: "Slide 4 is 🔥. The rest needs tightening." } })} />
            </div>
          </Stage>
        </Section>

        <Section title="Contextualized — several components together">
          <Stage label="A conversation thread" frame="h-[460px] p-0 flex flex-col">
            <Demo t={tree([
              { id: "root", type: "ConversationItem", props: P({ name: "Mara Okafor", channel: "WhatsApp", channelKey: "wa", presence: "online", hue: 16 }), childrenIds: ["d", "t1", "m1", "m2", "m3", "comp"] },
              { id: "d", type: "ThreadMarker", props: P({ label: "Today", kind: "date" }) },
              { id: "t1", type: "ThreadMarker", props: P({ label: "9:14 AM", kind: "time" }) },
              { id: "m1", type: "MessageBubble", props: P({ direction: "in", text: LINK, mentionsMe: true, reactions: [{ emoji: "👍", count: 2, self: true }], actions: ["reply", "react"] }) },
              { id: "m2", type: "MessageBubble", props: P({ direction: "out", text: "On it — sending by noon." }) },
              { id: "m3", type: "MessageBubble", props: P({ direction: "in", text: "Perfect 🙏", quoted: { label: "You", excerpt: "On it — sending by noon." } }) },
              { id: "comp", type: "Composer", props: P({ placeholder: "Message Mara…" }) },
            ])} />
          </Stage>

          <Stage label="An inbox" frame="[&>*]:max-w-[320px]">
            <Demo t={tree([
              { id: "root", type: "Stack", props: P({ gap: 8 }), childrenIds: ["banner", "sec1", "sec2"] },
              { id: "banner", type: "AlertBanner", props: P({ tone: "warn", title: "Telegram disconnected", detail: "Reconnect to keep receiving.", dismissible: true }) },
              { id: "sec1", type: "ListSection", props: P({ label: "Direct messages", count: 2 }), childrenIds: ["r1", "r2"] },
              { id: "r1", type: "ConversationItem", props: P({ name: "Mara Okafor", channelKey: "wa", preview: "Perfect — sending now.", time: "09:20", hue: 16, selected: true }) },
              { id: "r2", type: "ConversationItem", props: P({ name: "Luca Bianchi", channelKey: "tg", preview: "Te lo mando oggi.", time: "11:06", unread: 2, hue: 205 }) },
              { id: "sec2", type: "ListSection", props: P({ label: "Channels", count: 1 }), childrenIds: ["r3"] },
              { id: "r3", type: "ConversationItem", props: P({ name: "launch-room", channelKey: "slack", preview: "Dana: On it 👍", time: "08:46", unread: 3, hue: 280, group: true }) },
            ])} />
          </Stage>

          <Stage label="A dossier (person)" frame="[&>*]:max-w-[320px]">
            <Demo t={one("Dossier", {
              name: "Mara Okafor", role: "Head of Product", company: "Northwind", presence: "online", hue: 16, channelKey: "wa",
              channelKeys: ["wa", "mail", "slack"],
              facts: [{ label: "Company", value: "Northwind" }, { label: "Role", value: "Head of Product" }, { label: "Timezone", value: "CET (UTC+1)" }],
              topics: ["Launch", "Pricing", "Q3 roadmap"],
              files: [{ name: "Launch-deck-v4.pdf", meta: "4.2 MB" }, { name: "Pricing-model.xlsx", meta: "88 KB" }],
              brain: "Pricing is the one open thread — she owns the deck and expects it back by noon.",
            })} />
          </Stage>

          <Stage label="A dossier (group)" frame="[&>*]:max-w-[320px]">
            <Demo t={one("Dossier", {
              name: "launch-room", role: "Slack channel", group: true, presence: "online", hue: 280,
              members: [{ name: "DK", hue: 150 }, { name: "TM", hue: 35 }, { name: "MO", hue: 16 }, { name: "AB", hue: 260 }, { name: "JS", hue: 200 }, { name: "RP", hue: 320 }],
              facts: [{ label: "Members", value: "6" }, { label: "Known since", value: "Feb 2025" }],
              topics: ["Launch", "Pricing"],
              files: [{ name: "final-pricing.png", meta: "640 KB" }],
              brain: "3 people, 1 open decision: the per-seat price.",
            })} />
          </Stage>
        </Section>
      </main>
    </div>
  )
}

// ── screenshot-gate harness ─────────────────────────────────────────────────────────────────
// lab.html?shot=<Component>&theme=<dark|light> renders ONE component in isolation on a fixed 380px
// stage marked [data-shot], at the default accent — a DETERMINISTIC input for the pixel-diff gate
// (gates/screenshot.mjs snapshots each contract flagged `stable:true` and fails on visual drift).
const SHOTS: Record<string, A2uiTree> = {
  Avatar: one("Avatar", { alt: "Mara Okafor", channel: "wa", size: "lg", presence: "online" }),
  MessageBubble: one("MessageBubble", { text: "Just went through it — slide 4 is 🔥. The rest needs tightening.", direction: "out" }),
  ConversationItem: one("ConversationItem", { name: "Mara Okafor", preview: "Perfect — sending it over now.", time: "09:20", unread: 2 }),
  Composer: one("Composer", { placeholder: "Message Mara…" }),
  Chip: one("Chip", { label: "Launch", tone: "accent" }),
  ThreadMarker: one("ThreadMarker", { label: "Today", kind: "date" }),
  ListSection: one("ListSection", { label: "Direct messages", count: 3 }),
}

function Shot({ name, theme }: { name: string; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <div data-shot={name} style={{ width: 380, padding: 20, background: "var(--background)" }}>
      <Demo t={SHOTS[name]} />
    </div>
  )
}

// ── Hero surface harness (phase 33 t4) ───────────────────────────────────────────────────────
// lab.html?surface=hero renders ONLY the three product Heroes (each [data-slot="hero"]) as the
// whole page, so gate:browser can drive an isolated Hero surface. Theme comes from
// localStorage("astrochat.mode") (the same mechanism the a11y pass toggles), language from ?lang,
// accent stays the default — a deterministic, chrome-free input for the responsive + axe checks.
function HeroSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {HEROES.map((h) => (
          <Demo key={h.key} t={h.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── FeatureGrid surface harness (phase 34 t4) ────────────────────────────────────────────────
// lab.html?surface=features renders ONLY the three product FeatureGrids (each
// [data-slot="feature-grid"]) as the whole page, so gate:browser can drive an isolated FeatureGrid
// surface. Theme comes from localStorage("astrochat.mode") (the same mechanism the a11y pass
// toggles), language from ?lang, accent stays the default — a deterministic, chrome-free input for
// the responsive + axe + structure checks.
function FeaturesSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {FEATURES.map((f) => (
          <Demo key={f.key} t={f.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── Pricing surface harness (phase 35 t3) ────────────────────────────────────────────────────
// lab.html?surface=pricing renders ONLY the three product Pricings (each [data-slot="pricing"]) as
// the whole page, so gate:browser (t5) can drive an isolated Pricing surface — clicking/keyboarding
// the billing toggle, measuring overflow in both billing states, and checking the highlighted-plan
// reorder. Theme comes from localStorage("astrochat.mode") (the same mechanism the a11y pass
// toggles), language from ?lang, accent stays the default — a deterministic, chrome-free input.
function PricingSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {PRICING.map((p) => (
          <Demo key={p.key} t={p.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── FAQ surface harness (phase 36 t5) ────────────────────────────────────────────────────────
// lab.html?surface=faq renders ONLY the three product FAQs (each [data-slot="faq"]) as the whole
// page, so gate:browser (t6) can drive an isolated FAQ surface — clicking/keyboarding the narrow
// accordion, measuring overflow collapsed AND expanded, and checking the two-view (narrow
// collapsible accordion vs wide always-open 2-column grid) and single-open local state. Theme comes
// from localStorage("astrochat.mode") (the same mechanism the a11y pass toggles), language from
// ?lang, accent stays the default — a deterministic, chrome-free input.
function FaqSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {FAQS.map((q) => (
          <Demo key={q.key} t={q.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── CTASection surface harness (phase 37 t4) ─────────────────────────────────────────────────
// lab.html?surface=cta renders ONLY the three product CTASections (each [data-slot="cta"]) as the
// whole page, so gate:browser (t5) can drive an isolated CTASection surface — measuring overflow at
// the four widths, reading the accent-band recolor, checking the two-view flip (narrow
// stacked-centered vs wide left-text/right-CTAs split), and keyboarding the on-band CTAs. Theme
// comes from localStorage("astrochat.mode") (the same mechanism the a11y pass toggles), language
// from ?lang, accent stays the default — a deterministic, chrome-free input.
function CtaSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {CTAS.map((c) => (
          <Demo key={c.key} t={c.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── MarketingNav surface harness (phase 38 t4) ───────────────────────────────────────────────
// lab.html?surface=nav renders ONLY the three product MarketingNavs (each [data-slot="nav"]) as the
// whole page, so gate:browser (t5) can drive an isolated nav surface — measuring overflow at the
// four widths (bar collapsed AND drawer open), checking the two-view flip (wide inline links vs
// narrow hamburger), opening the Radix Dialog drawer via the hamburger, and keyboarding Esc + focus
// restore, plus axe over the sticky bar and the open drawer. Theme comes from
// localStorage("astrochat.mode") (the same mechanism the other surfaces use), language from ?lang,
// accent stays the default — a deterministic, chrome-free input. Three sticky bars stacked each
// stick within their own scroll context; the gate reads the first one.
function NavSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {NAVS.map((n) => (
          <Demo key={n.key} t={n.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── Footer surface harness (phase 39 t4) ─────────────────────────────────────────────────────
// lab.html?surface=footer renders ONLY the three product Footers (each [data-slot="footer"]) as the
// whole page, so gate:browser (t5) can drive an isolated footer surface — measuring overflow at the
// four widths (columns collapsed AND expanded), checking the two-view flip (narrow collapsible
// accordion columns vs wide always-open multi-column grid), opening the accordion columns, and
// keyboarding the disclosures, plus axe over the grid and the expanded accordion. Theme comes from
// localStorage("astrochat.mode") (the same mechanism the other surfaces use), language from ?lang,
// accent stays the default — a deterministic, chrome-free input.
function FooterSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {FOOTERS.map((f) => (
          <Demo key={f.key} t={f.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── Testimonials surface harness (phase 40 t4) ───────────────────────────────────────────────
// lab.html?surface=testimonials renders ONLY the three product Testimonials (each
// [data-slot="testimonials"]) as the whole page, so gate:browser (t5) can drive an isolated
// Testimonials surface — measuring overflow at the four widths (the carousel scrolling INTERNALLY so
// the page never scrolls sideways), checking the two-view flip (narrow horizontal scroll-snap
// carousel vs wide always-visible multi-column grid), scrolling the carousel to reach a card beyond
// the first, plus axe over the grid and the carousel. Theme comes from
// localStorage("astrochat.mode") (the same mechanism the other surfaces use), language from ?lang,
// accent stays the default — a deterministic, chrome-free input.
function TestimonialsSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {TESTIMONIALS.map((t) => (
          <Demo key={t.key} t={t.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

// ── Landing surface harness (phase 33 demo — composition, no new contract) ───────────────────
// lab.html?surface=landing renders ONLY the astrobot example landing: the five marketing components
// (Hero → FeatureGrid → Pricing → FAQ → CTASection) stacked full-width as the whole page, with NO
// lab chrome — the same declared trees as the per-component demos (index 0 of each). Theme comes
// from localStorage("astrochat.mode") (the same mechanism the other surfaces use), language from
// ?lang, accent stays the default — a deterministic, chrome-free composed page for the overflow +
// axe checks.
function LandingSurface({ lang, theme }: { lang: Lang; theme: "dark" | "light" }) {
  React.useLayoutEffect(() => {
    const r = document.documentElement
    r.classList.toggle("dark", theme === "dark")
    r.style.setProperty("--acc-h", String(ACCENTS[0].h))
    r.style.setProperty("--acc-c", String(ACCENTS[0].c))
  }, [theme])
  return (
    <LangProvider value={lang}>
      <div className="bg-background text-foreground">
        {LANDING_ASTROBOT.map((s) => (
          <Demo key={s.key} t={s.tree} />
        ))}
      </div>
    </LangProvider>
  )
}

const _params = new URLSearchParams(location.search)
const _shot = _params.get("shot")
const _shotTheme = _params.get("theme") === "light" ? "light" : "dark"
const _surface = _params.get("surface")
const _lang: Lang = _params.get("lang") === "en" ? "en" : "it"
const _surfaceTheme: "dark" | "light" = (() => {
  try { return localStorage.getItem("astrochat.mode") === "light" ? "light" : "dark" } catch { return "dark" }
})()

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {_surface === "hero"
      ? <HeroSurface lang={_lang} theme={_surfaceTheme} />
      : _surface === "features"
        ? <FeaturesSurface lang={_lang} theme={_surfaceTheme} />
        : _surface === "pricing"
          ? <PricingSurface lang={_lang} theme={_surfaceTheme} />
          : _surface === "faq"
            ? <FaqSurface lang={_lang} theme={_surfaceTheme} />
            : _surface === "cta"
              ? <CtaSurface lang={_lang} theme={_surfaceTheme} />
              : _surface === "nav"
                ? <NavSurface lang={_lang} theme={_surfaceTheme} />
                : _surface === "footer"
                  ? <FooterSurface lang={_lang} theme={_surfaceTheme} />
                  : _surface === "testimonials"
                    ? <TestimonialsSurface lang={_lang} theme={_surfaceTheme} />
                    : _surface === "landing"
                      ? <LandingSurface lang={_lang} theme={_surfaceTheme} />
                      : _shot && SHOTS[_shot]
                        ? <Shot name={_shot} theme={_shotTheme} />
                        : <Lab />}
  </React.StrictMode>,
)
