import { z } from "zod"

import {
  AtSign,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Gauge,
  Globe,
  Hash,
  Layers,
  Link,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  Plug,
  Rss,
  Send,
  Share2,
  Shield,
  Sparkles,
  Star,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react"

// The single OWNED source of the curated icon vocabulary for FeatureGrid (phase 34 t1).
// A FeatureGrid item declares its `icon` as a plain string from this allow-list, validated at the
// A2UI pipeline boundary by `iconNameSchema` (a Zod enum) and resolved internally to a real
// lucide-react component through `ICONS`. Deriving the enum and the resolution map from ONE tuple
// (`ICON_NAMES`) means the enum members and the map keys can never disagree: an allowed name always
// resolves to a real glyph, and an unknown name is a contract error at the enum, never a crash and
// never raw SVG through a prop (CONTEXT.md rule: icons via name-token, not hardcoded SVG).
//
// The curated set is deliberately small and marketing/agent-relevant (CONTEXT.md decision).

export const ICON_NAMES = [
  "zap",
  "bot",
  "calendar",
  "mail",
  "message-circle",
  "layers",
  "workflow",
  "plug",
  "shield",
  "lock",
  "clock",
  "globe",
  "sparkles",
  "gauge",
  "check",
  "share-2",
  "chevron-down",
  "menu",
  // Social / contact set for the Footer social row (phase 39 t1). lucide-react no longer exports the
  // brand glyphs (Github/Linkedin/Twitter), so these are exported generic social/contact glyphs.
  "at-sign",
  "hash",
  "link",
  "rss",
  "send",
  // Rating glyph for the Testimonials star rating (phase 40 t1).
  "star",
] as const

export const iconNameSchema = z.enum(ICON_NAMES)

export type IconName = z.infer<typeof iconNameSchema>

// Exhaustive by construction: `Record<IconName, LucideIcon>` makes TypeScript enforce that EVERY
// enum member has a mapping and no key falls outside the enum, so the enum and the resolution can
// never drift apart (C3a: an allowed name always resolves to a real glyph).
export const ICONS: Record<IconName, LucideIcon> = {
  "zap": Zap,
  "bot": Bot,
  "calendar": Calendar,
  "mail": Mail,
  "message-circle": MessageCircle,
  "layers": Layers,
  "workflow": Workflow,
  "plug": Plug,
  "shield": Shield,
  "lock": Lock,
  "clock": Clock,
  "globe": Globe,
  "sparkles": Sparkles,
  "gauge": Gauge,
  "check": Check,
  "share-2": Share2,
  "chevron-down": ChevronDown,
  "menu": Menu,
  "at-sign": AtSign,
  "hash": Hash,
  "link": Link,
  "rss": Rss,
  "send": Send,
  "star": Star,
}
