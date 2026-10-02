import type { ReactNode } from "react"
import { z } from "zod"

import { Avatar } from "./avatar"
import { Chip } from "./chip"
import { Attachment } from "./attachment"
import { CHANNEL_META } from "./channels"

// Dossier — the right-hand "scheda": everything the body knows about the selected party, rendered
// from one declared node. The identity section is the product thesis made visible: for a person,
// the channels they're reachable on collapse to ONE identity; for a group, its members. A single
// rich catalog component (structured Zod props) rather than a dozen tiny nodes — the allow-list /
// Zod boundary still owns the whole payload.
const chanEnum = z.enum(["wa", "tg", "slack", "mail", "teams", "cu"])

export const dossierPropsSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  presence: z.enum(["online", "away", "offline"]).optional(),
  group: z.boolean().optional(),
  hue: z.number().optional(),
  avatarSrc: z.string().optional(),
  channelKey: chanEnum.optional(),
  channelKeys: z.array(chanEnum).optional(),
  facts: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  topics: z.array(z.string()).optional(),
  // `dataKey`, when present, makes the file card a click target: the host wires
  // the actual preview via event delegation (data-action="open-file" + data-key),
  // keeping this component presentational (no url/parse concerns here).
  files: z.array(z.object({ name: z.string(), meta: z.string(), dataKey: z.string().optional() })).optional(),
  members: z.array(z.object({ name: z.string(), hue: z.number().optional() })).optional(),
  brain: z.string().optional(),
})

export type DossierProps = z.infer<typeof dossierPropsSchema>

const presenceLabel = { online: "Active now", away: "Away", offline: "Offline" } as const

function Section({ title, accent, children }: { title: string; accent?: string; children: ReactNode }) {
  return (
    <div className="border-b border-border-soft px-5 py-4">
      <h3 className="mb-[11px] font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-faint">
        {title}
        {accent && <span className="text-[var(--accent-ink)]"> · {accent}</span>}
      </h3>
      {children}
    </div>
  )
}

function Dossier({ name, role, company, presence, group, hue, avatarSrc, channelKey, channelKeys, facts, topics, files, members, brain, nameSlot }: DossierProps & { nameSlot?: ReactNode }) {
  return (
    <>
      <div className="border-b border-border-soft px-5 pb-[18px] pt-6 text-center">
        <div className="mx-auto mb-3 w-fit">
          <Avatar alt={name} src={avatarSrc} hue={hue} size="xl" channel={channelKey} />
        </div>
        {nameSlot ?? <div className="text-[17px] font-semibold tracking-[-.01em]">{name}</div>}
        {(role || company) && (
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {role && <span className="font-medium text-foreground">{role}</span>}
            {role && company && !group ? " · " : ""}
            {!group && company ? company : ""}
          </div>
        )}
        {presence && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[.06em] text-muted-foreground">
            <span
              className="size-[7px] rounded-full"
              style={{ background: presence === "online" ? "var(--green)" : presence === "away" ? "var(--amber)" : "var(--faint)" }}
            />
            {presenceLabel[presence]}
          </div>
        )}
      </div>

      {group ? (
        members && members.length > 0 && (
          <Section title="Members">
            <div className="flex items-center">
              {members.slice(0, 5).map((m, i) => (
                <span key={i} className="-ml-2 first:ml-0 rounded-full ring-2 ring-[var(--panel)]">
                  <Avatar alt={m.name} hue={m.hue ?? (hue ?? 210) + i * 40} size="xs" />
                </span>
              ))}
              {members.length > 5 && <span className="ml-2 font-mono text-[12px] text-muted-foreground">+{members.length - 5} more</span>}
            </div>
          </Section>
        )
      ) : (
        channelKeys && channelKeys.length > 0 && (
          <Section title="Reachable on" accent="one identity">
            <div className="flex flex-wrap gap-1.5">
              {channelKeys.map((k) => (
                <Chip key={k} label={CHANNEL_META[k].label} channelKey={k} />
              ))}
            </div>
          </Section>
        )
      )}

      {facts && facts.length > 0 && (
        <Section title="Details">
          <div className="flex flex-col gap-[9px]">
            {facts.map((f, i) => (
              <div key={i} className="flex justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="text-right font-medium tabular-nums">{f.value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {topics && topics.length > 0 && (
        <Section title="Open topics">
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <Chip key={t} label={t} tone="accent" />
            ))}
          </div>
        </Section>
      )}

      {files && files.length > 0 && (
        <Section title="Shared files">
          <div className="flex flex-col gap-2">
            {files.map((f, i) =>
              f.dataKey ? (
                <button
                  key={i}
                  type="button"
                  data-action="open-file"
                  data-key={f.dataKey}
                  className="cursor-pointer text-left"
                >
                  <Attachment kind="file" name={f.name} meta={f.meta} variant="card" />
                </button>
              ) : (
                <Attachment key={i} kind="file" name={f.name} meta={f.meta} variant="card" />
              ),
            )}
          </div>
        </Section>
      )}

      {brain && (
        <div className="m-5 rounded-xl border border-[var(--acc-line)] bg-[var(--acc-dim)] px-3.5 py-3">
          <div className="mb-[7px] flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--accent-ink)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5"><path d="M9 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 11a2.5 2.5 0 0 0 1.5 4.5A2.5 2.5 0 0 0 9 20a2 2 0 0 0 3-1.7V5.7A2 2 0 0 0 9 4Z" /><path d="M15 4a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 11a2.5 2.5 0 0 1-1.5 4.5A2.5 2.5 0 0 1 15 20a2 2 0 0 1-3-1.7" /></svg>
            What the brain knows
          </div>
          <p className="text-[13px] leading-relaxed text-foreground">{brain}</p>
        </div>
      )}
    </>
  )
}

export { Dossier }
