interface Props {
  pct: number
  label: string
}

export function ProgressBar({ pct, label }: Props) {
  return (
    <>
      <div className="mb-1.5 h-3.5 overflow-hidden rounded-full bg-[#e8ddd0]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-school-green to-school-blue transition-[width] duration-300"
          style={{ width: `${Math.min(pct, 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mb-3 text-center text-sm font-bold text-school-soft">{label}</p>
    </>
  )
}
