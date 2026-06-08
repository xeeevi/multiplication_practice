interface Props {
  /** Total count to render as tens (bars) + units (crosses). */
  n: number
  /** Visual scale: 'md' = full size, 'sm' = compact (for inside bags). */
  scale?: 'md' | 'sm'
  className?: string
}

/** Renders a number using place-value notation: blue bars for tens, orange crosses for units. */
export function NumberBlocks({ n, scale = 'md', className = '' }: Props) {
  const tens = Math.floor(n / 10)
  const units = n % 10

  const barClass =
    scale === 'sm'
      ? 'inline-block flex-shrink-0 w-[8px] h-[32px] rounded-[2px] bg-school-blue border border-school-blue-sh'
      : 'inline-block flex-shrink-0 w-[12px] h-[46px] rounded-[3px] bg-school-blue border-2 border-school-blue-sh'

  const crossClass =
    scale === 'sm'
      ? 'inline-flex flex-shrink-0 items-center justify-center text-[18px] text-school-orange font-black leading-none'
      : 'inline-flex flex-shrink-0 items-center justify-center text-[26px] text-school-orange font-black leading-none'

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {Array.from({ length: tens }, (_, i) => (
        <span key={`bar-${i}`} className={barClass} aria-hidden />
      ))}
      {Array.from({ length: units }, (_, i) => (
        <span key={`cross-${i}`} className={crossClass} aria-hidden>
          +
        </span>
      ))}
    </div>
  )
}
