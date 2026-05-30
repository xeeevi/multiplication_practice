import { useState, useEffect } from 'react'

/**
 * Returns true when the primary input is a coarse pointer (touch screen).
 * Used to suppress the native keyboard on tablets so children use the on-screen pad.
 */
export function useCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(
    () => window.matchMedia('(pointer: coarse)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const handler = (e: MediaQueryListEvent) => setIsCoarse(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isCoarse
}
