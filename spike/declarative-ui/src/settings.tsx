import * as React from "react"

import { Overlay } from "@astro/ui"
import { Menu, MenuItem, MenuSeparator } from "@astro/ui"

// Settings + account chrome, ported from astrobot's design (Settings modal: nav rail + General
// pane; each row = title/description + a control). Preferences and ACCENT live HERE, not in the
// sidebar footer — the footer is just the account button + a theme toggle, exactly as astrobot.

export type Accent = { id: string; name: string; h: number; c: number }
// astrobot's exact 5 accents (lib/theme.ts): one hue + chroma knob drives the whole surface.
export const ACCENTS: Accent[] = [
  { id: "ice", name: "Ice", h: 226, c: 0.11 },
  { id: "iris", name: "Iris", h: 292, c: 0.13 },
  { id: "rose", name: "Rose", h: 12, c: 0.15 },
  { id: "amber", name: "Amber", h: 70, c: 0.13 },
  { id: "jade", name: "Jade", h: 158, c: 0.12 },
]
export const swatchColor = (a: Accent) => `oklch(0.66 ${a.c} ${a.h})`

const I = {
  sliders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" /></svg>,
  plug: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5" /></svg>,
  sparkles: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" /></svg>,
  monitor: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>,
  gauge: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 13l4-4M3.5 15a9 9 0 1 1 17 0" /></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V7a1.7 1.7 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
  help: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01" /></svg>,
  mega: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8" /></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>,
  right: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></svg>,
  moon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>,
}

export function AccountMenu({ trigger, onSettings }: { trigger: React.ReactNode; onSettings: () => void }) {
  return (
    <Menu trigger={trigger} side="top" align="start" sideOffset={8}>
      <MenuItem icon={I.gauge} right={<span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">33% {I.right}</span>}>Weekly usage</MenuItem>
      <MenuSeparator />
      <MenuItem icon={I.gear} onSelect={onSettings}>Settings</MenuItem>
      <MenuItem icon={I.info}>About</MenuItem>
      <MenuItem icon={I.help}>Help Center</MenuItem>
      <MenuItem icon={I.mega}>Send Feedback</MenuItem>
      <MenuSeparator />
      <MenuItem icon={I.logout}>Log out</MenuItem>
    </Menu>
  )
}

function Select({ value, onChange, options, dot }: { value: string; onChange: (v: string) => void; options: [string, string][]; dot?: string }) {
  return (
    <label className="select">
      {dot && <span className="adot" style={{ background: dot }} />}
      {options.find((o) => o[0] === value)?.[1] ?? value}
      {I.chevron}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return <button className="toggle" aria-pressed={on} onClick={onToggle} aria-label="toggle" />
}

const NAV: [keyof typeof I, string][] = [["sliders", "General"], ["plug", "Plugins"], ["sparkles", "Skills"], ["monitor", "Computer"], ["chart", "Usage & Billing"], ["download", "Updates"]]

export function Settings({
  theme, setTheme, accent, setAccent, onClose,
}: {
  theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void
  accent: Accent; setAccent: (a: Accent) => void; onClose: () => void
}) {
  const [hwAccel, setHwAccel] = React.useState(true)
  const [hwKeys, setHwKeys] = React.useState(false)
  const [lang, setLang] = React.useState("en")

  return (
    // Overlay (Radix Dialog): focus-trap + Escape + scrim-dismiss + portal + scroll-lock come free,
    // replacing the hand-rolled .scrim/.modal. hideTitle/hideClose: this pane owns its own header.
    <Overlay
      open
      onOpenChange={(o) => { if (!o) onClose() }}
      title="Settings"
      hideTitle
      hideClose
      placement="center"
      className="grid h-[min(680px,92svh)] w-[min(920px,calc(100vw-2rem))] grid-cols-[220px_minmax(0,1fr)] rounded-2xl p-0 max-md:grid-cols-1"
    >
        <nav className="set-nav max-md:hidden">
          {NAV.map(([icon, label]) => (
            <button key={label} className={label === "General" ? "on" : ""}>{I[icon]}{label}</button>
          ))}
        </nav>
        <div className="set-main">
          <div className="set-top">
            <h2>General</h2>
            <button className="iconbtn" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="set-scroll">
            <div className="set-card">
              <div className="set-row">
                <div><div className="t">Appearance</div><div className="d">How astrochat looks on this device.</div></div>
                <div className="ctrl"><Select value={theme} onChange={(v) => setTheme(v as "dark" | "light")} options={[["dark", "Dark"], ["light", "Light"]]} /></div>
              </div>
              <div className="set-row">
                <div><div className="t">Accent</div><div className="d">Tints buttons, highlights, focus rings — and gives the whole surface its hue.</div></div>
                <div className="ctrl">
                  <Select
                    value={accent.id}
                    onChange={(v) => setAccent(ACCENTS.find((a) => a.id === v) ?? ACCENTS[0])}
                    options={ACCENTS.map((a) => [a.id, a.name] as [string, string])}
                    dot={swatchColor(accent)}
                  />
                </div>
              </div>
              <div className="set-row">
                <div><div className="t">Language</div><div className="d">The language of the astrochat interface.</div></div>
                <div className="ctrl"><Select value={lang} onChange={setLang} options={[["en", "English"], ["it", "Italiano"]]} /></div>
              </div>
              <div className="set-row">
                <div><div className="t">Use hardware acceleration</div><div className="d">Render with the GPU. Turn off if you see visual glitches.</div></div>
                <div className="ctrl"><Toggle on={hwAccel} onToggle={() => setHwAccel((v) => !v)} /></div>
              </div>
            </div>

            <div className="set-glabel">Account</div>
            <div className="set-card">
              <div className="set-row">
                <div><div className="t">Timezone</div><div className="d">Used for message times and scheduling.</div></div>
                <div className="ctrl"><Select value="auto" onChange={() => {}} options={[["auto", "Auto-detect (Europe/Rome)"]]} /></div>
              </div>
              <div className="set-row">
                <div><div className="t">Use hardware security keys</div><div className="d">Allow a security key (such as a YubiKey) for approvals.</div></div>
                <div className="ctrl"><Toggle on={hwKeys} onToggle={() => setHwKeys((v) => !v)} /></div>
              </div>
            </div>
          </div>
        </div>
    </Overlay>
  )
}

export const ThemeIcon = { sun: I.sun, moon: I.moon }
