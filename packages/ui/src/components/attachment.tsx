import { z } from "zod"

import { cn } from "../lib/utils"

// Attachment — ONE component for "a file/media rendered", every layout (redundancy pass:
// MediaAttachment's inline block, SentAttachments' file card, StagedAttachment's outbound chip, and
// FileGrid's tile were the SAME use with different layout — extend one, don't split four). `variant`
// picks the shape; `kind` picks the treatment; `gone` is the honest "no longer available" fallback
// (Hermes rule). Display is declarable; the actual download/remove is host-mediated (`data-action`).
export const attachmentPropsSchema = z.object({
  kind: z.enum(["image", "video", "audio", "file"]),
  name: z.string().optional(),
  meta: z.string().optional(),
  src: z.string().optional(),
  variant: z.enum(["inline", "card", "tile", "chip"]).optional(),
  gone: z.boolean().optional(),
  dataKey: z.string().optional(),
})

export type AttachmentProps = z.infer<typeof attachmentPropsSchema>

const FileGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]"><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" /><path d="M13 3v6h6" /></svg>
)

function Attachment({ kind, name, meta, src, variant = "card", gone, dataKey }: AttachmentProps) {
  if (gone) {
    return (
      <span data-slot="attachment" data-gone className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[var(--card)] px-2.5 py-1.5 text-[12px] text-muted-foreground">
        <FileGlyph />
        {name ?? "Attachment"} · no longer available
      </span>
    )
  }

  // inline image (chat: image-then-caption) / tile (grid): the media shows itself
  if ((kind === "image" || kind === "video") && (variant === "inline" || variant === "tile")) {
    return (
      <span data-slot="attachment" data-action="open" data-key={dataKey} className={cn("block overflow-hidden rounded-2xl border border-border", variant === "tile" ? "aspect-square" : "max-w-[280px]")}>
        {src ? <img src={src} alt={name ?? ""} className="size-full object-cover" /> : <span className="grid aspect-video place-items-center bg-[var(--card)] text-muted-foreground"><FileGlyph /></span>}
      </span>
    )
  }

  // outbound staged chip — name + size + remove
  if (variant === "chip") {
    return (
      <span data-slot="attachment" className="inline-flex items-center gap-2 rounded-lg border border-border bg-[var(--card)] py-1 pl-2 pr-1 text-[12.5px]">
        <FileGlyph />
        <span className="max-w-[160px] truncate">{name ?? "file"}</span>
        {meta && <span className="font-mono text-[11px] text-muted-foreground">{meta}</span>}
        <button type="button" data-action="remove" data-key={dataKey} aria-label="Remove" className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">×</button>
      </span>
    )
  }

  // default: a file card — icon + name + meta, opens on click
  return (
    <span data-slot="attachment" data-action="open" data-key={dataKey} className="flex max-w-[280px] cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-[var(--card)] px-2.5 py-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-muted-foreground"><FileGlyph /></span>
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-medium">{name ?? "file"}</span>
        {meta && <span className="block font-mono text-[11px] text-muted-foreground">{meta}</span>}
      </span>
    </span>
  )
}

export { Attachment }
