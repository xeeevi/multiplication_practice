const SYMBOLS = [
  { sym: '×', left: '4%',  top: '8%',  dur: '6.5s', delay: '0s'   },
  { sym: '+', left: '91%', top: '13%', dur: '7.2s', delay: '1s'   },
  { sym: '÷', left: '14%', top: '78%', dur: '8.1s', delay: '0.5s' },
  { sym: '=', left: '82%', top: '72%', dur: '5.8s', delay: '2s'   },
  { sym: '×', left: '50%', top: '4%',  dur: '9.0s', delay: '0.3s' },
  { sym: '+', left: '33%', top: '88%', dur: '6.3s', delay: '1.5s' },
  { sym: '×', left: '72%', top: '42%', dur: '7.7s', delay: '0.8s' },
  { sym: '=', left: '22%', top: '52%', dur: '5.5s', delay: '2.5s' },
]

/**
 * Fixed-position decorative layer of slowly floating math symbols.
 * Pure presentational — pointer-events none, aria-hidden.
 */
export function BackgroundDeco() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {SYMBOLS.map(({ sym, left, top, dur, delay }, i) => (
        <span
          key={i}
          className="absolute animate-float font-sans text-[2.2em] font-black text-school-blue opacity-[0.06]"
          style={{ left, top, '--dur': dur, animationDelay: delay } as React.CSSProperties}
        >
          {sym}
        </span>
      ))}
    </div>
  )
}
