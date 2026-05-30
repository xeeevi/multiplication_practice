import { useEffect, useRef } from 'react'

const COLORS = [
  '#27ae60', '#e67e22', '#2980b9', '#8e44ad', '#f39c12', '#e74c3c',
]

interface ConfettiPiece {
  id: number
  left: string
  color: string
  size: number
  round: boolean
  fallDur: string
  rot: string
  drift: string
  delay: string
}

function makePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    size: 6 + Math.random() * 8,
    round: Math.random() > 0.5,
    fallDur: `${1.5 + Math.random() * 2}s`,
    rot: `${Math.floor(Math.random() * 720)}deg`,
    drift: `${Math.random() * 200 - 100}px`,
    delay: `${Math.random() * 0.5}s`,
  }))
}

interface Props {
  active: boolean
}

/**
 * Spawns confetti pieces when `active` transitions to true.
 * Removes them from the DOM after the longest animation completes.
 */
export function Confetti({ active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const pieces = makePieces(60)
    const container = containerRef.current
    if (!container) return

    pieces.forEach((p) => {
      const el = document.createElement('div')
      el.style.cssText = [
        `position:fixed`,
        `top:-10px`,
        `left:${p.left}`,
        `width:${p.size}px`,
        `height:${p.size}px`,
        `background:${p.color}`,
        `border-radius:${p.round ? '50%' : '2px'}`,
        `z-index:100`,
        `--fall-dur:${p.fallDur}`,
        `--rot:${p.rot}`,
        `--drift:${p.drift}`,
        `animation-delay:${p.delay}`,
        `animation:confettiFall ${p.fallDur} linear forwards`,
      ].join(';')
      container.appendChild(el)
      setTimeout(() => el.remove(), 4000)
    })
  }, [active])

  return <div ref={containerRef} />
}
