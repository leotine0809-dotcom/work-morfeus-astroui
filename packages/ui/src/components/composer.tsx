import * as React from "react"
import { z } from "zod"
import { ArrowUp, Loader2, Mic, Plus } from "lucide-react"

import { Textarea } from "./ui/textarea"
import { cn } from "../lib/utils"

// Composer — the message input bar, taking astrobot's exact frame (phase 53 t2): a rounded card,
// an autosizing textarea, and the closed footer anatomy `[attach] … [dictate][send]`. The FRAME is
// all this component owns (PD-8, phase 53 PLAN): the skills `/` menu, dictation wiring, upload,
// reply banner, attachment chips, drag overlay and tooltips stay in the app's own composer.tsx and
// are handed in as slots (`attach`, `dictate`, `children` above the textarea, `overlay`, `popover`)
// or via `containerProps` (drag handlers spread on the card). Controlled when `value` AND
// `onChange` are both given, else the component keeps its own internal state — so the spike/lab
// still renders with no host wired up at all.
export const composerPropsSchema = z.object({
  placeholder: z.string().optional(),
  value: z.string().optional(),
  disabled: z.boolean().optional(),
  // sendableWhenEmpty lets the host enable Send with an empty textarea — used when
  // there is a STAGED ATTACHMENT to send with no caption (a document/image alone is
  // a valid message). Default false keeps the plain-text rule (no empty sends).
  sendableWhenEmpty: z.boolean().optional(),
})

export type ComposerSchemaProps = z.infer<typeof composerPropsSchema>

export interface ComposerLabels {
  attach?: string
  dictate?: string
  send?: string
}

export interface ComposerIcons {
  attach?: React.ReactNode
  dictate?: React.ReactNode
  send?: React.ReactNode
}

export interface ComposerProps extends ComposerSchemaProps {
  /** Fires on every keystroke. Pair with `value` to make the textarea CONTROLLED. */
  onChange?: (value: string) => void
  /** Enter-without-Shift — unless the caller's own `onKeyDown` already called `preventDefault`. */
  onSubmit?: (value: string) => void
  /** Overrides the built-in canSend rule (`!disabled && (sendableWhenEmpty || text.trim())`). */
  canSend?: boolean
  /** Swaps the send icon for a spinner (an upload in flight) without disabling the button. */
  busy?: boolean
  labels?: ComposerLabels
  icons?: ComposerIcons
  /** Slot nodes REPLACING the default attach/dictate buttons — behaviour follows PRESENCE. */
  attach?: React.ReactNode
  dictate?: React.ReactNode
  /** Rendered ABOVE the textarea — reply banners, attachment chips. */
  children?: React.ReactNode
  /** Rendered first, inside the card (a drag-over overlay). */
  overlay?: React.ReactNode
  /** An `inset-x-4 bottom-full` region above the card (the `/` skills menu). */
  popover?: React.ReactNode
  /** True while a drag is over the card; the host owns the drag handlers via `containerProps`. */
  dragging?: boolean
  textareaRef?: React.Ref<HTMLTextAreaElement>
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>
  /** Called FIRST; call `event.preventDefault()` to suppress the built-in Enter-sends rule. */
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>
  /** Spread on the outer card — drag handlers and any other DOM prop the host needs on the frame. */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
}

const AUTOSIZE_MAX_PX = 200

export function Composer({
  placeholder = "Message…",
  value,
  disabled = false,
  sendableWhenEmpty = false,
  onChange,
  onSubmit,
  canSend: canSendProp,
  busy = false,
  labels,
  icons,
  attach,
  dictate,
  children,
  overlay,
  popover,
  dragging = false,
  textareaRef,
  onPaste,
  onKeyDown,
  containerProps,
}: ComposerProps) {
  const [internalText, setInternalText] = React.useState(value ?? "")
  const controlled = value !== undefined && onChange !== undefined
  const text = controlled ? value : internalText

  const setText = (next: string) => {
    if (!controlled) setInternalText(next)
    onChange?.(next)
  }

  const autosize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, AUTOSIZE_MAX_PX)}px`
  }

  const canSend = canSendProp ?? (!disabled && (sendableWhenEmpty || text.trim().length > 0))
  const submit = () => {
    if (!canSend) return
    onSubmit?.(text)
  }

  const iconBtn =
    "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"

  return (
    <div
      {...containerProps}
      data-slot="composer"
      className={cn(
        "relative mx-auto max-w-6xl rounded-3xl border border-border bg-card px-4 pb-2.5 pt-3.5 shadow-sm transition-colors focus-within:border-ring/60",
        disabled && "opacity-60",
        dragging && "border-ring border-dashed bg-accent/40",
        containerProps?.className,
      )}
    >
      {overlay}
      {popover}
      {children}
      <Textarea
        ref={textareaRef}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value)
          autosize(e.target)
        }}
        onPaste={onPaste}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.defaultPrevented) return
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        rows={1}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-[24px] resize-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 disabled:cursor-not-allowed dark:bg-transparent"
      />
      <div className="mt-2 flex items-center justify-between">
        {attach ?? (
          <button
            type="button"
            data-action="attach"
            aria-label={labels?.attach ?? "Attach"}
            title={labels?.attach ?? "Attach"}
            className={iconBtn}
          >
            {icons?.attach ?? <Plus className="size-4" />}
          </button>
        )}
        <div className="flex items-center gap-1">
          {dictate ?? (
            <button
              type="button"
              data-action="dictate"
              aria-label={labels?.dictate ?? "Voice message"}
              title={labels?.dictate ?? "Voice message"}
              className={iconBtn}
            >
              {icons?.dictate ?? <Mic className="size-4" />}
            </button>
          )}
          <button
            type="button"
            data-action="send"
            disabled={!canSend}
            aria-label={labels?.send ?? "Send"}
            onClick={submit}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-sm transition disabled:bg-[var(--panel-2)] disabled:text-faint disabled:shadow-none"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : (icons?.send ?? <ArrowUp className="size-4" />)}
          </button>
        </div>
      </div>
    </div>
  )
}
