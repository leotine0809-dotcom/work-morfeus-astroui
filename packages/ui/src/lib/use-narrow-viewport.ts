import { useEffect, useState } from "react"

import { GEOMETRY } from "../tokens/index"

// useNarrowViewport — the phone-breakpoint check extracted from astrobot's `app/use-page-state.ts`
// (phase 53 t5), same listener shape: sync on mount, then on every `matchMedia` change. Reads
// `GEOMETRY.narrowMaxPx` (the closed `--breakpoint-narrow` token) so the number is minted once.
export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia(`(max-width: ${GEOMETRY.narrowMaxPx}px)`)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return narrow
}
