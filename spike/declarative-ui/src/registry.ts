import * as React from "react"
import { defineRegistry } from "@json-render/react"

import { catalog } from "@/catalog"
import { Avatar } from "@astro/ui"
import { MessageBubble } from "@astro/ui"
import { ConversationItem } from "@astro/ui"
import { Composer } from "@astro/ui"
import { Stack } from "@astro/ui"
import { ChannelButton } from "@astro/ui"
import { Dossier } from "@astro/ui"
import { ThreadMarker } from "@astro/ui"
import { RichText } from "@astro/ui"
import { ListSection } from "@astro/ui"
import { Chip } from "@astro/ui"
import { Attachment } from "@astro/ui"
import { AlertBanner } from "@astro/ui"
import { SearchField } from "@astro/ui"
import { ChipInput } from "@astro/ui"
import { Hero } from "@/components/hero"
import { FeatureGrid } from "@/components/feature-grid"
import { Pricing } from "@/components/pricing"
import { FAQ } from "@/components/faq"
import { CTASection } from "@/components/cta-section"
import { MarketingNav } from "@/components/marketing-nav"
import { Footer } from "@/components/footer"
import { Testimonials } from "@/components/testimonials"

// The declarative-UI registry (PLAN.md t8) — binds the catalog's allow-listed component names to
// the REAL React implementations, turning an allow-listed node into an actual rendered component
// (C2). `children` MUST be forwarded (remediate-c0): json-render's Renderer only mounts a node's
// childrenIds if the registry entry itself places `children` in its output — dropping it orphans
// every node reached only via a parent's childrenIds (the whole shell relies on this: Stack ->
// rows/buttons, ConversationItem -> bubbles + composer).
export const { registry } = defineRegistry(catalog, {
  components: {
    Stack: ({ props, children }) => React.createElement(Stack, props, children),
    Avatar: ({ props, children }) => React.createElement(Avatar, props, children),
    MessageBubble: ({ props, children }) => React.createElement(MessageBubble, props, children),
    ConversationItem: ({ props, children }) => React.createElement(ConversationItem, props, children),
    Composer: ({ props, children }) => React.createElement(Composer, props, children),
    ChannelButton: ({ props, children }) => React.createElement(ChannelButton, props, children),
    Dossier: ({ props, children }) => React.createElement(Dossier, props, children),
    ThreadMarker: ({ props }) => React.createElement(ThreadMarker, props),
    RichText: ({ props }) => React.createElement(RichText, props),
    ListSection: ({ props, children }) => React.createElement(ListSection, props, children),
    Chip: ({ props }) => React.createElement(Chip, props),
    Attachment: ({ props }) => React.createElement(Attachment, props),
    AlertBanner: ({ props }) => React.createElement(AlertBanner, props),
    SearchField: ({ props }) => React.createElement(SearchField, props),
    ChipInput: ({ props }) => React.createElement(ChipInput, props),
    Hero: ({ props }) => React.createElement(Hero, props),
    FeatureGrid: ({ props }) => React.createElement(FeatureGrid, props),
    Pricing: ({ props }) => React.createElement(Pricing, props),
    FAQ: ({ props }) => React.createElement(FAQ, props),
    CTASection: ({ props }) => React.createElement(CTASection, props),
    MarketingNav: ({ props }) => React.createElement(MarketingNav, props),
    Footer: ({ props }) => React.createElement(Footer, props),
    Testimonials: ({ props }) => React.createElement(Testimonials, props),
  },
})
