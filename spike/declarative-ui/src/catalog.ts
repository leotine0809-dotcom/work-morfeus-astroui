import { defineCatalog } from "@json-render/core"
import { schema } from "@json-render/react/schema"

import { avatarPropsSchema } from "@astro/ui"
import { messageBubblePropsSchema } from "@astro/ui"
import { conversationItemPropsSchema } from "@astro/ui"
import { composerPropsSchema } from "@astro/ui"
import { stackPropsSchema } from "@astro/ui"
import { channelButtonPropsSchema } from "@astro/ui"
import { dossierPropsSchema } from "@astro/ui"
import { threadMarkerPropsSchema } from "@astro/ui"
import { richTextPropsSchema } from "@astro/ui"
import { listSectionPropsSchema } from "@astro/ui"
import { chipPropsSchema } from "@astro/ui"
import { attachmentPropsSchema } from "@astro/ui"
import { alertBannerPropsSchema } from "@astro/ui"
import { searchFieldPropsSchema } from "@astro/ui"
import { chipInputPropsSchema } from "@astro/ui"
import { heroPropsSchema } from "@/components/hero"
import { featureGridPropsSchema } from "@/components/feature-grid"
import { pricingPropsSchema } from "@/components/pricing"
import { faqPropsSchema } from "@/components/faq"
import { ctaSectionPropsSchema } from "@/components/cta-section"
import { marketingNavPropsSchema } from "@/components/marketing-nav"
import { footerPropsSchema } from "@/components/footer"
import { testimonialsPropsSchema } from "@/components/testimonials"

// The declarative-UI catalog (PLAN.md t7) — the LLM's ENTIRE allowed vocabulary. Built from the
// co-located Zod prop schemas, each of which is already both the runtime validation boundary AND
// the LLM prompt-generation source. Extended past the original 4 comms primitives with the shell
// vocabulary (Stack container, ChannelButton, Dossier) so a declared tree can express EVERY pane
// of the astrochat app — rail, list, thread, scheda — not just one chat thread.
export const catalog = defineCatalog(schema, {
  components: {
    Stack: {
      props: stackPropsSchema,
      description: "A layout container: renders its children in a column (or row) with a gap. Use as the root of a list of siblings (rail buttons, conversation rows).",
    },
    Avatar: {
      props: avatarPropsSchema,
      description: "A generated initials-on-hue avatar disc (NOT a mascot), with an optional channel corner-badge and presence dot.",
    },
    MessageBubble: {
      props: messageBubblePropsSchema,
      description: "One chat message. direction \"out\" = the viewer's own (accented), \"in\" = the other party's. sender/senderHue label a group bubble; mentionsMe rings it; quoted shows a reply-to; reactions render folded pills; actions (reply/react/forward) appear on hover. trust \"peer\" makes links inert.",
    },
    RichText: {
      props: richTextPropsSchema,
      description: "A message body string rendered rich: markdown/bare links become clickable, @mentions become accent chips. trust \"peer\" renders links inert (untrusted sender).",
    },
    ListSection: {
      props: listSectionPropsSchema,
      description: "A collapsible group header for a list; renders its child rows below unless collapsed. Use to group conversation rows (People / Channels, Important / Archived).",
    },
    Chip: {
      props: chipPropsSchema,
      description: "One small labelled pill: a topic (tone accent), a channel (channelKey adds a colour dot), or an entity ref (open = a link, inert = shown but not clickable). A strip = a Stack(row) of Chips.",
    },
    Attachment: {
      props: attachmentPropsSchema,
      description: "A file/media rendered: variant inline/tile (image shows itself), card (icon+name+meta), or chip (staged outbound). gone = the honest 'no longer available' fallback. Download/remove is host-mediated.",
    },
    AlertBanner: {
      props: alertBannerPropsSchema,
      description: "A dismissible banner making a degrade/notice visible without blocking. tone info/warn; dismiss is host-mediated.",
    },
    SearchField: {
      props: searchFieldPropsSchema,
      description: "A search input; with `count` set it becomes find-in-thread (index/total + prev/next). Value + steps host-mediated.",
    },
    ChipInput: {
      props: chipInputPropsSchema,
      description: "A token field that produces chips (recipients, tags). Distinct from Chip (which only displays one). Add/remove host-mediated.",
    },
    ConversationItem: {
      props: conversationItemPropsSchema,
      description: "Dual-purpose: with NO children it is one row in the conversation list (avatar+name+channel+preview+unread); WITH children it is the open conversation view (header + the message bubbles + the composer as its last child).",
    },
    Composer: {
      props: composerPropsSchema,
      description: "The message input bar at the bottom of a conversation.",
    },
    ThreadMarker: {
      props: threadMarkerPropsSchema,
      description: "One marker between messages: kind \"date\" = a sticky day pill, kind \"time\" = an inline cluster time, kind \"label\" = a centered divider (thread start / exceptional sender). Never stamp each bubble.",
    },
    ChannelButton: {
      props: channelButtonPropsSchema,
      description: "One channel icon in the left rail (carries the channel key; maps to its own glyph and label). active = current filter, badge = unread count.",
    },
    Dossier: {
      props: dossierPropsSchema,
      description: "The right-hand person/group dossier (\"scheda\"): hero, the channels one identity is reachable on (or group members), details, open topics, shared files, and a brain summary.",
    },
    Hero: {
      props: heroPropsSchema,
      description: "A marketing/landing hero: eyebrow?/title/subtitle?/primaryCta/secondaryCta? + a media slot. All text is {it,en} LangText (never a bare string); media is a structured { kind:image|mockup, src?, alt } descriptor resolved internally, never raw code.",
    },
    FeatureGrid: {
      props: featureGridPropsSchema,
      description: "A marketing feature grid: an optional {it,en} heading (eyebrow?/title?/subtitle?) over items[] of { icon, title, description }; icon is a name from an owned enum resolved internally to a lucide glyph, never raw code; all text is {it,en}.",
    },
    Pricing: {
      props: pricingPropsSchema,
      description: "A marketing pricing block: an optional {it,en} heading (eyebrow?/title?/subtitle?) and a monthly/annual billing toggle over plans[], each with name/priceMonthly+priceAnnual/features/cta and an optional badge; exactly one plan is highlighted. All prose is {it,en}; prices are plain currency strings (never translated); the per-feature check glyph and the toggle are resolved internally, never raw code.",
    },
    FAQ: {
      props: faqPropsSchema,
      description: "A marketing FAQ block: an optional {it,en} heading (eyebrow?/title?/subtitle?) over items[] of { question, answer }; all text is {it,en}. The narrow view is a single-open collapsible accordion, the wide view a 2-column always-open grid; the disclosure chevron is an owned name-token glyph resolved internally, never raw code.",
    },
    CTASection: {
      props: ctaSectionPropsSchema,
      description: "A marketing call-to-action band: an optional {it,en} eyebrow + title + optional {it,en} subtitle over a primaryCta and an optional secondaryCta, each { label:{it,en}, href }; all text is {it,en}. The whole section is an accent band (bg-primary/text-primary-foreground) recoloring with the accent knob; the narrow view stacks the text and full-width CTAs centered, the wide view splits text on the left and CTAs on the right. There is no media/icon slot and no prop carries raw code.",
    },
    MarketingNav: {
      props: marketingNavPropsSchema,
      description: "A marketing top navigation bar: a required brand { name:{it,en}, optional brandIcon name-token from an owned enum resolved internally } + optional links[] (each { label:{it,en}, href }) + a required primaryCta and an optional secondaryCta (each { label:{it,en}, href }); all text is {it,en}. It is a sticky top bar (named z step, hairline, solid surface) with a two-view: the wide view shows the links INLINE in the bar with the CTAs to the right, the narrow view hides the inline links behind a hamburger button that opens a Radix Dialog drawer holding the stacked links + both CTAs. No prop carries raw code.",
    },
    Footer: {
      props: footerPropsSchema,
      description: "A marketing/landing site footer: a required brand { name:{it,en}, optional brandIcon name-token from an owned enum resolved internally, optional tagline:{it,en} } + a required non-empty columns[] (each { heading:{it,en}, links:[{ label:{it,en}, href }] }) + an optional social[] (each { icon name-token from an owned enum resolved internally, href, label:{it,en} }) + a required bottom { copyright:{it,en}, optional legalLinks:[{ label:{it,en}, href }] }; all text is {it,en}. It has a two-view: the narrow view collapses each link column into a keyboard-operable Radix Accordion disclosure (links hidden until its heading is activated), the wide view is an always-open multi-column grid with every link visible; the bottom is a hairline legal bar. No prop carries raw code.",
    },
    Testimonials: {
      props: testimonialsPropsSchema,
      description: "A marketing/landing testimonials block (social proof): an optional {it,en} heading (eyebrow?/title?/subtitle?) + an optional {it,en} ratingLabel template over a required non-empty items[], each { quote:{it,en}, author:{ name, role:{it,en} }, avatar?:{ src?, alt:{it,en} }, rating?:1..5 }; all text is {it,en} EXCEPT author.name, which is a plain (untranslated) string. It has a two-view: the wide view is a multi-column grid with every card visible, the narrow view a horizontal scroll-snap carousel whose overflow-x is confined to the track so the page never scrolls sideways. The optional 1..5 star rating is resolved from the owned `star` name-token internally (never raw code) with an accessible {it,en} label; the avatar is a structured { src?, alt } descriptor resolved to an <img> when a src is declared, else the author's initials, never raw markup. No prop carries raw code.",
    },
  },
  actions: {},
})

// The allow-list source for the adapter (C3): every type name an LLM-declared node may use is
// exactly the catalog's component keys — never hand-maintained separately from `catalog`.
export const ALLOWED_COMPONENT_TYPES = catalog.componentNames
