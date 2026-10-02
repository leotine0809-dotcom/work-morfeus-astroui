import * as React from "react"

import { renderConversation } from "@/pipeline"
import { CHANNEL_META, type ChannelKey } from "@astro/ui"
import type { A2uiTree } from "@/a2ui/schema"
import { Toaster, toast } from "sonner"

import { AccountMenu, Settings, ACCENTS, type Accent, ThemeIcon } from "@/settings"

// astrochat shell (the real dogfood) — the app owns ONLY the 4-column grid + the brushed-metal
// rail chrome (globals.css). EVERY pane's content — the channel buttons, the conversation rows,
// the open thread, the dossier — is a declared A2UI tree rendered through astro-ui's SAME
// registry + Zod + allow-list pipeline the phase-31 spike proved. Interactivity is host-mediated
// (event-delegation on `data-key` / `data-action`) because a declared tree carries JSON, not
// callbacks. If a pane can't be expressed in the catalog, that's a real astro-ui gap surfacing —
// which is the whole point of building a whole app on it instead of one chat bubble.

type Reaction = { emoji: string; count?: number; who?: string[]; self?: boolean }
type Msg = {
  dir: "in" | "out"; text: string; t: string; day?: string; sender?: string; hue?: number
  mentionsMe?: boolean; trust?: "full" | "peer"
  quoted?: { label: string; excerpt: string }
  reactions?: Reaction[]
  actions?: ("reply" | "react" | "forward")[]
}
type Scheda = {
  role: string; company: string; channels: ChannelKey[]; facts: { label: string; value: string }[]
  topics: string[]; files: { name: string; meta: string }[]; members?: { name: string; hue: number }[]; brain: string
}
type Convo = {
  id: string; name: string; channel: ChannelKey; hue: number; presence: "online" | "away" | "offline"
  unread: number; time: string; group?: boolean; msgs: Msg[]; scheda: Scheda
}

const RAIL: { key: ChannelKey; badge?: number }[] = [
  { key: "all", badge: 5 }, { key: "wa", badge: 2 }, { key: "tg" },
  { key: "slack", badge: 3 }, { key: "mail" }, { key: "teams" },
]

// Canned replies for the simulated remote message after you send (prototype only) — enough variety
// that repeated sends feel alive while exercising the stick-to-bottom / unseen-FAB paths.
const REPLIES = [
  "Got it — on it now.",
  "Makes sense 👍",
  "Perfect, thanks!",
  "Let me check and get back to you.",
  "Sounds good. Talk soon.",
  "👀 looking",
]

const SEED: Convo[] = [
  {
    id: "mara", name: "Mara Okafor", channel: "wa", hue: 16, presence: "online", unread: 0, time: "09:20",
    msgs: [
      { dir: "in", text: "Morning! Ready for a big week 🚀", t: "08:20", day: "Yesterday" },
      { dir: "out", text: "Morning — let's make it count. Standup at 9?", t: "08:21" },
      { dir: "in", text: "9 works. I'll bring the numbers.", t: "08:22" },
      { dir: "out", text: "Perfect. Did marketing send the final copy?", t: "08:24" },
      { dir: "in", text: "Not yet — chasing them now. Should land before lunch.", t: "08:26" },
      { dir: "out", text: "Great. Ping me the moment it's in.", t: "08:27" },
      { dir: "in", text: "Will do 👍", t: "08:28" },
      { dir: "out", text: "Also — can we lock the pricing tiers today? Sales keeps asking.", t: "08:32" },
      { dir: "in", text: "Yes. Let's decide on the call.", t: "08:35" },
      { dir: "out", text: "Did you get a chance to review the competitor teardown?", t: "08:37" },
      { dir: "in", text: "Skimmed it. Their onboarding is slick — we should borrow the empty states.", t: "08:39" },
      { dir: "out", text: "Agreed. I'll spec it after launch.", t: "08:40" },
      { dir: "in", text: "The demo video is rendering now, ~10 min.", t: "08:42" },
      { dir: "out", text: "Nice. Drop it in the drive when it's done.", t: "08:43" },
      { dir: "in", text: "Will do. Also legal signed off on the ToS changes.", t: "08:45" },
      { dir: "out", text: "That was the last blocker 🎉", t: "08:46" },
      { dir: "in", text: "Almost there. Coffee?", t: "08:48" },
      { dir: "out", text: "Always. Meet you downstairs in 5.", t: "08:50" },
      {
        dir: "in", t: "09:14",
        text: "Hey @[Alex] — did you see the [launch deck](https://northwind.example/deck)?",
        mentionsMe: true,
        reactions: [{ emoji: "👍", count: 2, who: ["You", "Tom"], self: true }, { emoji: "🔥", count: 1, who: ["Dana"] }],
        actions: ["reply", "react", "forward"],
      },
      { dir: "out", text: "Just went through it — slide 4 is 🔥. The rest needs tightening.", t: "09:16" },
      {
        dir: "in", t: "09:17",
        text: "Agreed. Want me to redo the pricing section before the review?",
        quoted: { label: "You", excerpt: "Just went through it — slide 4 is 🔥. The rest needs tightening." },
        actions: ["reply", "react", "forward"],
      },
      { dir: "out", text: "Yes please. Can you have it ready by noon?", t: "09:18" },
      { dir: "in", text: "Perfect — sending it over now.", t: "09:20" },
    ],
    scheda: {
      role: "Head of Product", company: "Northwind", channels: ["wa", "mail", "slack"],
      facts: [{ label: "Company", value: "Northwind" }, { label: "Role", value: "Head of Product" }, { label: "Timezone", value: "CET (UTC+1)" }, { label: "Known since", value: "Mar 2025" }],
      topics: ["Launch", "Pricing", "Q3 roadmap"],
      files: [{ name: "Launch-deck-v4.pdf", meta: "4.2 MB" }, { name: "Pricing-model.xlsx", meta: "88 KB" }],
      brain: "You’ve touched the launch 6× this week. Pricing is the one open thread — she owns the deck and expects it back by noon.",
    },
  },
  {
    id: "luca", name: "Luca Bianchi", channel: "tg", hue: 205, presence: "away", unread: 0, time: "11:06",
    msgs: [
      { dir: "in", text: "Ciao, per il contratto di Andrea serve la clausola di non concorrenza?", t: "11:02" },
      { dir: "out", text: "Sì, ma va limitata a 12 mesi e a un raggio ragionevole — altrimenti è nulla.", t: "11:05" },
      { dir: "in", text: "Perfetto. Te lo mando in bozza oggi.", t: "11:06" },
    ],
    scheda: {
      role: "Consulente del lavoro", company: "Studio Molinero", channels: ["tg", "mail"],
      facts: [{ label: "Company", value: "Studio Molinero" }, { label: "Role", value: "Consulente" }, { label: "Timezone", value: "CET (UTC+1)" }, { label: "Known since", value: "Jan 2025" }],
      topics: ["Contratti", "Buste paga"],
      files: [{ name: "Contratto-Andrea-bozza.docx", meta: "32 KB" }],
      brain: "Labor-law counsel, same-day turnaround. Open item: the non-compete clause on Andrea’s contract.",
    },
  },
  {
    id: "room", name: "launch-room", channel: "slack", hue: 280, presence: "online", unread: 3, time: "08:46", group: true,
    msgs: [
      { dir: "in", sender: "Dana", hue: 150, text: "Deck’s in the drive — final pricing still TBD.", t: "08:40" },
      { dir: "in", sender: "Tom", hue: 35, text: "Can we lock the number before the investor call?", t: "08:42" },
      { dir: "out", text: "Locking $49/seat. Dana, update slide 7.", t: "08:45" },
      { dir: "in", sender: "Dana", hue: 150, text: "On it 👍", t: "08:46" },
    ],
    scheda: {
      role: "Slack channel", company: "6 members", channels: ["slack"],
      facts: [{ label: "Members", value: "6" }, { label: "Timezone", value: "Mixed" }, { label: "Known since", value: "Feb 2025" }],
      topics: ["Launch", "Pricing"],
      files: [{ name: "final-pricing.png", meta: "640 KB" }],
      members: [{ name: "DK", hue: 150 }, { name: "TM", hue: 35 }, { name: "MO", hue: 16 }, { name: "AB", hue: 260 }, { name: "JS", hue: 200 }, { name: "RP", hue: 320 }],
      brain: "3 people, 1 open decision: the per-seat price. Dana is waiting on slide 7.",
    },
  },
  {
    id: "priya", name: "Priya Nair", channel: "mail", hue: 330, presence: "offline", unread: 0, time: "Tue",
    msgs: [
      { dir: "in", text: "Following up on the data room — can you share the Q2 metrics?", t: "17:30", day: "Yesterday" },
      { dir: "out", text: "Sending the updated deck + metrics by EOD. Thanks for the patience.", t: "18:02", day: "Yesterday" },
      { dir: "in", text: "Great, appreciate it. Let’s find time next week.", t: "08:10", day: "Today" },
    ],
    scheda: {
      role: "Partner", company: "Vertex Capital", channels: ["mail"],
      facts: [{ label: "Company", value: "Vertex Capital" }, { label: "Role", value: "Partner" }, { label: "Timezone", value: "EST (UTC−5)" }, { label: "Known since", value: "Feb 2025" }],
      topics: ["Fundraise", "Metrics"],
      files: [{ name: "Q2-metrics.pdf", meta: "1.1 MB" }],
      brain: "Investor, warm. Waiting on two things from you: the Q2 metrics and a meeting slot next week.",
    },
  },
]

const firstName = (n: string) => n.replace(/^#/, "").split(" ")[0]

// ── tree builders: DATA -> declared A2UI trees (each with a "root" node) ──────────────────
function railTree(filter: ChannelKey): A2uiTree {
  const nodes: A2uiTree["nodes"] = [
    { id: "root", type: "Stack", props: { direction: "row", gap: 4, align: "center" }, childrenIds: RAIL.map((r) => `ch-${r.key}`) },
  ]
  for (const r of RAIL) {
    nodes.push({ id: `ch-${r.key}`, type: "ChannelButton", props: { channelKey: r.key, badge: r.badge, active: r.key === filter, dataKey: r.key } })
  }
  return { nodes }
}

function listTree(convos: Convo[], filter: ChannelKey, activeId: string, q: string): A2uiTree {
  const query = q.trim().toLowerCase()
  const visible = convos.filter(
    (c) => (filter === "all" || c.channel === filter) &&
      (!query || c.name.toLowerCase().includes(query) || c.msgs.some((m) => m.text.toLowerCase().includes(query)))
  )
  // group the list into collapsible sections (People vs Channels — the ADR-008 person/group split).
  const sections = [
    { id: "sec-people", label: "Direct messages", rows: visible.filter((c) => !c.group) },
    { id: "sec-channels", label: "Channels", rows: visible.filter((c) => c.group) },
  ].filter((s) => s.rows.length > 0)

  const showDegrade = filter === "all" || filter === "tg"
  const nodes: A2uiTree["nodes"] = [
    { id: "root", type: "Stack", props: { gap: 6 }, childrenIds: [...(showDegrade ? ["degrade"] : []), ...sections.map((s) => s.id)] },
  ]
  if (showDegrade) {
    nodes.push({ id: "degrade", type: "AlertBanner", props: { tone: "warn", title: "Telegram disconnected", detail: "Reconnect to keep receiving messages.", dismissible: true, dataKey: "degrade" } })
  }
  for (const s of sections) {
    nodes.push({ id: s.id, type: "ListSection", props: { label: s.label, count: s.rows.length, dataKey: s.id }, childrenIds: s.rows.map((c) => `row-${c.id}`) })
    for (const c of s.rows) {
      const last = [...c.msgs].reverse().find((m) => m.text)!
      const label = last.dir === "out" ? "You: " : c.group && last.sender ? `${last.sender}: ` : ""
      nodes.push({
        id: `row-${c.id}`, type: "ConversationItem",
        props: { name: c.name, channelKey: c.channel, preview: label + last.text, time: c.time, unread: c.unread || undefined, selected: c.id === activeId, group: c.group, hue: c.hue, dataKey: c.id },
      })
    }
  }
  return { nodes }
}

const parseMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0) }
const CLUSTER_GAP = 20 // minutes — astrobot's CLUSTER_GAP_MS
// mock 12h format for the inline time marker (real build: toLocaleTimeString by chat language)
const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  const ap = h >= 12 ? "PM" : "AM"; const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`
}

// astrobot's two-marker thread: a STICKY date pill at each day change + an INLINE time marker at
// each cluster start (>20-min lull). Bubbles carry no stamp of their own. Built by the host from
// the timestamps and declared as TimeMarker nodes — astro-ui renders them.
function threadTree(c: Convo): A2uiTree {
  const nodes: A2uiTree["nodes"] = [{ id: "root", type: "ConversationItem", props: { name: c.name, channel: CHANNEL_META[c.channel].label, channelKey: c.channel, presence: c.presence, group: c.group, hue: c.hue }, childrenIds: [] }]
  const childrenIds: string[] = []
  if (c.group) {
    nodes.push({ id: "divider-start", type: "ThreadMarker", props: { label: `${c.name} · ${c.scheda.company}`, kind: "label" } })
    childrenIds.push("divider-start")
  }
  let lastDay: string | null = null
  let lastMin: number | null = null
  c.msgs.forEach((m, i) => {
    const day = m.day ?? "Today"
    const min = parseMin(m.t)
    const dayChanged = day !== lastDay
    if (dayChanged) { nodes.push({ id: `date${i}`, type: "ThreadMarker", props: { label: day, kind: "date" } }); childrenIds.push(`date${i}`) }
    if (dayChanged || lastMin === null || min - lastMin > CLUSTER_GAP) { nodes.push({ id: `time${i}`, type: "ThreadMarker", props: { label: fmt12(m.t), kind: "time" } }); childrenIds.push(`time${i}`) }
    nodes.push({
      id: `m${i}`, type: "MessageBubble",
      props: {
        text: m.text, direction: m.dir, sender: m.sender, senderHue: m.hue, msgId: `m${i}`,
        mentionsMe: m.mentionsMe, trust: m.trust, quoted: m.quoted, reactions: m.reactions, actions: m.actions,
      },
    })
    childrenIds.push(`m${i}`)
    lastDay = day; lastMin = min
  })
  nodes.push({ id: "composer", type: "Composer", props: { placeholder: `Message ${firstName(c.name)}…` } })
  childrenIds.push("composer")
  nodes[0].childrenIds = childrenIds
  return { nodes }
}

function schedaTree(c: Convo): A2uiTree {
  return {
    nodes: [{
      id: "root", type: "Dossier",
      props: {
        name: c.name, role: c.scheda.role, company: c.scheda.company, presence: c.presence, group: c.group, hue: c.hue, channelKey: c.channel,
        channelKeys: c.group ? undefined : c.scheda.channels,
        members: c.group ? c.scheda.members : undefined,
        facts: c.scheda.facts, topics: c.scheda.topics, files: c.scheda.files, brain: c.scheda.brain,
      },
    }],
  }
}

function Pane({ tree }: { tree: A2uiTree }): React.ReactElement {
  return renderConversation(tree)
}

export function App(): React.ReactElement {
  const [convos, setConvos] = React.useState<Convo[]>(SEED)
  const [activeId, setActiveId] = React.useState("mara")
  const [filter, setFilter] = React.useState<ChannelKey>("all")
  const [q, setQ] = React.useState("")
  const [viewing, setViewing] = React.useState(false)
  // Preferences live in Settings (astrobot), not the sidebar footer. Initial values read the
  // no-flash script's storage so React's first render already agrees with <html> (no flash).
  const [accent, setAccent] = React.useState<Accent>(() => {
    try {
      const a = localStorage.getItem("astrochat.acc")?.split(",")
      return ACCENTS.find((x) => a && String(x.h) === a[0]) ?? ACCENTS[0]
    } catch { return ACCENTS[0] }
  })
  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    try { return localStorage.getItem("astrochat.mode") === "light" ? "light" : "dark" } catch { return "dark" }
  })
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  // resizable rails — the app owns the widths, the handle only reports the drag (astrobot's model).
  // Geometry from DESIGN-DNA §6: left 240–480 (default 340), right (scheda) 240–460 (default 320).
  const [leftW, setLeftW] = React.useState(340)
  const [rightW, setRightW] = React.useState(320)
  const drag = React.useRef<"left" | "right" | null>(null)
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const onDragStart = (side: "left" | "right") => (e: React.PointerEvent) => {
    drag.current = side
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.setAttribute("data-drag", "true")
  }
  const onDragMove = (e: React.PointerEvent) => {
    if (drag.current === "left") setLeftW(clamp(e.clientX, 240, 480))
    else if (drag.current === "right") setRightW(clamp(window.innerWidth - e.clientX, 240, 460))
  }
  const onDragEnd = (e: React.PointerEvent) => {
    if (drag.current) { e.currentTarget.setAttribute("data-drag", "false"); drag.current = null }
  }

  const active = convos.find((c) => c.id === activeId) ?? convos[0]

  // Chat-scroll controller (host-mediated, like send/onRow) — the 3rd acute mechanic. Stick-to-
  // bottom ONLY when the reader is parked at the bottom; if they've scrolled up to read history a
  // new message must NOT yank them down — it lights a jump-to-latest FAB carrying the unseen count.
  // Opening a thread lands on the newest. The scroll element is the catalog's own
  // [data-slot="conversation-thread"] (found by selector, the same host-mediated seam as send()).
  const scrollEl = React.useRef<HTMLElement | null>(null)
  const atBottomRef = React.useRef(true)
  const [atBottom, setAtBottom] = React.useState(true)
  const [unseen, setUnseen] = React.useState(0)
  const NEAR = 80 // px from the bottom that still counts as "parked at the bottom"
  // Direct scrollTop, not scrollTo({behavior:"smooth"}): instant is the chat convention, it's
  // reduced-motion-safe by construction, and it's deterministic (smooth can stall under headless).
  const pinToBottom = (el: HTMLElement) => { el.scrollTop = el.scrollHeight }
  const jumpToLatest = () => {
    const el = scrollEl.current
    if (!el) return
    pinToBottom(el)
    atBottomRef.current = true; setAtBottom(true); setUnseen(0)
  }
  // (a) thread switch: (re)bind the scroll listener + land on the newest message.
  React.useEffect(() => {
    const el = document.querySelector<HTMLElement>('.thread [data-slot="conversation-thread"]')
    scrollEl.current = el
    if (!el) return
    el.scrollTop = el.scrollHeight
    atBottomRef.current = true; setAtBottom(true); setUnseen(0)
    const onScroll = () => {
      const parked = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR
      atBottomRef.current = parked; setAtBottom(parked); if (parked) setUnseen(0)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [activeId])
  // (b) a new message in the OPEN thread: pin if parked at the bottom, else count it as unseen.
  React.useEffect(() => {
    const el = scrollEl.current
    if (!el) return
    if (atBottomRef.current) pinToBottom(el)
    else setUnseen((n) => n + 1)
  }, [active.msgs.length])

  // Theme + accent knob live on <html> (DESIGN-DNA §7 / astrobot's no-flash pattern) — NOT on an
  // inner div. `color` is inherited: if `.dark` sits below <body>, then <body>'s
  // `color: var(--foreground)` resolves OUTSIDE .dark (the light/dark-text value) and every element
  // that inherits colour instead of declaring it renders black-on-black. The class must be an
  // ancestor of <body>.
  React.useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.style.setProperty("--acc-h", String(accent.h))
    root.style.setProperty("--acc-c", String(accent.c))
    try {
      localStorage.setItem("astrochat.mode", theme)
      localStorage.setItem("astrochat.acc", `${accent.h},${accent.c}`)
    } catch { /* private mode / blocked storage — the in-memory state still drives the UI */ }
  }, [theme, accent])

  // keep the thread pinned to the newest message on switch / send
  React.useEffect(() => {
    const el = document.querySelector<HTMLElement>('.thread [data-slot="conversation-thread"]')
    if (el) el.scrollTop = el.scrollHeight
  }, [activeId, convos])

  const onRail = (e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-key]")
    if (btn?.dataset.key) setFilter(btn.dataset.key as ChannelKey)
  }
  const onRow = (e: React.MouseEvent) => {
    // a section header also carries data-key — only a conversation ROW opens a thread.
    if ((e.target as HTMLElement).closest('[data-action="toggle-section"]')) return
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-slot="conversation-item"]')
    const id = row?.dataset.key
    if (!id) return
    setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
    setActiveId(id)
    setViewing(true)
  }
  const send = () => {
    const ta = document.querySelector<HTMLTextAreaElement>('.thread [data-composer] textarea')
    const v = ta?.value.trim()
    if (!v) return
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    // Sending is a deliberate action → always return the reader to the newest (pin), even if they
    // were scrolled up reading history. Only REMOTE messages respect a scrolled-up reader (the FAB).
    atBottomRef.current = true; setAtBottom(true); setUnseen(0)
    setConvos((prev) => prev.map((c) => (c.id === activeId ? { ...c, time: fmt12(now), msgs: [...c.msgs, { dir: "out", text: v, t: now }] } : c)))
    // Simulated reply so the thread breathes and the remote-message path (stick-to-bottom vs. unseen
    // FAB) is real: if you're parked at the bottom it scrolls into view; if you've scrolled up, it
    // lights the jump-to-latest count instead of yanking you down.
    const replyTo = activeId
    window.setTimeout(() => {
      const t2 = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      const line = REPLIES[Math.floor(Math.random() * REPLIES.length)]
      setConvos((prev) => prev.map((c) => (c.id === replyTo ? { ...c, time: fmt12(t2), msgs: [...c.msgs, { dir: "in" as const, text: line, t: t2 }] } : c)))
    }, 1500)
    if (ta) {
      // The Composer is a CONTROLLED React textarea; a plain `ta.value = ""` is intercepted by
      // React's value tracker (no onChange fires), so its internal state keeps the old text and the
      // box never clears. Clear THROUGH React's native setter so the tracker registers the change
      // and onChange → setText("") runs.
      const nativeSet = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
      nativeSet?.call(ta, "")
      ta.style.height = "auto"
      ta.dispatchEvent(new Event("input", { bubbles: true }))
    }
    const ch = CHANNEL_META[active.channel]?.label ?? "channel"
    toast.success("Sent", { description: `Delivered on ${ch}` })
  }
  const onThreadClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-action="send"]')) send()
  }
  const onThreadKey = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement
    if (t.closest("[data-composer]") && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  const scopeTitle = filter === "all" ? "All inboxes" : CHANNEL_META[filter].label
  const scopeTag = filter === "all" ? "6 channels" : filter

  return (
    <div className={`app${viewing ? " viewing" : ""}`} style={{ ["--left-w" as string]: `${leftW}px`, ["--right-w" as string]: `${rightW}px` }}>
      <div className="resizer resizer-left" role="separator" aria-label="Resize sidebar" onPointerDown={onDragStart("left")} onPointerMove={onDragMove} onPointerUp={onDragEnd} />
      <div className="resizer resizer-right" role="separator" aria-label="Resize dossier" onPointerDown={onDragStart("right")} onPointerMove={onDragMove} onPointerUp={onDragEnd} />

      <aside className="sidebar">
        <div className="topbar">
          <div className="brandrow">
            <div className="logo">
              <span className="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /></svg></span>
              <span className="word">astrochat</span>
            </div>
            <button className="iconbtn" title="New conversation" aria-label="New conversation">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          <div className="channels" onClick={onRail}>
            <Pane tree={railTree(filter)} />
          </div>
        </div>

        <div className="list-head">
          <h1>{scopeTitle} <span className="scope">{scopeTag}</span></h1>
          <label className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, messages…" />
            <kbd className="kbd">⌘K</kbd>
          </label>
        </div>

        <div className="list-scroll" onClick={onRow}>
          <Pane tree={listTree(convos, filter, activeId, q)} />
        </div>

        <div className="foot">
          {/* Radix DropdownMenu owns open/close, click-outside, Escape, keyboard nav — no app state. */}
          <AccountMenu
            trigger={<button className="acctbtn"><span className="disc">A</span>Alex Carofiglio</button>}
            onSettings={() => setSettingsOpen(true)}
          />
          <button className="iconbtn" title="Toggle theme" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? ThemeIcon.sun : ThemeIcon.moon}
          </button>
        </div>
      </aside>

      <main className="thread" onClick={onThreadClick} onKeyDown={onThreadKey}>
        <button className="mobile-back" onClick={() => setViewing(false)} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <Pane tree={threadTree(active)} />
        {/* jump-to-latest FAB — shown only when scrolled up; carries the unseen-message count. */}
        {!atBottom && (
          <button className="jump-fab" onClick={jumpToLatest} aria-label={unseen > 0 ? `Jump to ${unseen} new message${unseen > 1 ? "s" : ""}` : "Jump to latest"}>
            {unseen > 0 && <span className="jump-count">{unseen}</span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </button>
        )}
      </main>

      <aside className="scheda">
        <Pane tree={schedaTree(active)} />
      </aside>

      {settingsOpen && (
        <Settings theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} onClose={() => setSettingsOpen(false)} />
      )}

      {/* Toaster — sonner, at the app root. Theme-synced; sits on the top rung (--z-toast) so a
          toast always clears a modal (--z-modal). The one place transient feedback surfaces. */}
      <Toaster theme={theme} position="bottom-right" richColors style={{ zIndex: "var(--z-toast)" as unknown as number }} />
    </div>
  )
}
