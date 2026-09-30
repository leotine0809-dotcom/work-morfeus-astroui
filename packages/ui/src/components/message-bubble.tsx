import * as React from "react"
import { z } from "zod"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"
import { RichText } from "./rich-text"

// MessageBubble — the OUTER SHAPE only (phase 53 t3, PD-8): direction, max-width, radius, padding,
// colours. Markdown, ask cards, tool rows, attachments and feedback stay in astrobot's chat.tsx and
// are passed in as `children`; when no children are given the bubble falls back to rendering `text`
// through `RichText`. Reactions/reply-quote/hover actions from the earlier Hermes-carrying version
// are gone — astrobot is the only consumer and never used them (PLAN.md t3).
export const messageBubblePropsSchema = z.object({
  text: z.string().optional(),
  direction: z.enum(["in", "out"]),
  sender: z.string().optional(),
  senderHue: z.number().optional(),
  msgId: z.string().optional(),
})

export type MessageBubbleProps = z.infer<typeof messageBubblePropsSchema>

const bubbleVariants = cva(
  "min-w-0 [overflow-wrap:anywhere] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
  {
    variants: {
      direction: {
        in: "bg-[var(--bubble-in)] text-foreground",
        out: "bg-[var(--bubble-out)] text-[var(--bubble-out-foreground)]",
      },
      constrained: {
        true: "max-w-[78%]",
        false: "",
      },
    },
    defaultVariants: {
      direction: "in",
      constrained: true,
    },
  },
)

export interface MessageBubbleComponentProps
  extends MessageBubbleProps,
    Pick<VariantProps<typeof bubbleVariants>, "constrained">,
    Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "dir"> {
  children?: React.ReactNode
}

function MessageBubble({
  text,
  direction,
  sender,
  senderHue = 210,
  msgId,
  constrained = true,
  children,
  className,
  ...rest
}: MessageBubbleComponentProps) {
  const isOut = direction === "out"
  return (
    <div
      {...rest}
      data-slot="message-bubble"
      data-direction={direction}
      data-msg-id={msgId}
      className={cn(bubbleVariants({ direction, constrained }), className)}
    >
      {/* group sender label — INSIDE the bubble as its first child (astrobot chat.tsx:773),
          `.peer-author`-compatible so the group header there can adopt this markup verbatim. */}
      {!isOut && sender && (
        <div className="peer-author mb-0.5 text-[11px] font-semibold" style={{ ["--peer-h" as string]: senderHue }}>
          {sender}
        </div>
      )}
      {children ?? <RichText text={text ?? ""} />}
    </div>
  )
}

export { MessageBubble }
