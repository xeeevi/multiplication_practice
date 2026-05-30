import { useLanguage } from '../hooks/useLanguage'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0']

/** On-screen number pad — always visible, works on both touch and desktop. */
export function NumberPad({ value, onChange, onSubmit, disabled }: Props) {
  const { tr } = useLanguage()

  function handleDigit(d: string) {
    if (disabled) return
    if (d === '⌫') {
      onChange(value.slice(0, -1))
    } else if (value.length < 4) {
      onChange(value + d)
    }
  }

  return (
    <div className="mx-auto mt-4 grid max-w-[270px] grid-cols-3 gap-2">
      {DIGITS.map((d) => (
        <button
          key={d}
          onClick={() => handleDigit(d)}
          disabled={disabled}
          className={[
            'rounded-[13px] border-2 py-3 font-sans text-[1.55em] font-bold',
            'select-none touch-manipulation transition-all',
            'active:translate-y-[3px] active:border-b',
            'disabled:pointer-events-none disabled:opacity-40',
            d === '⌫'
              ? 'border-school-orange border-b-[4px] border-b-school-orange-sh bg-[#fff3e6] text-school-orange'
              : 'border-school-border border-b-[4px] border-b-[#c8bfb5] bg-school-card2 text-school-text',
          ].join(' ')}
          aria-label={d === '⌫' ? 'Esborra' : d}
        >
          {d}
        </button>
      ))}

      {/* Check / submit button spans all 3 columns */}
      <button
        onClick={onSubmit}
        disabled={disabled || value === ''}
        className={[
          'col-span-3 rounded-[15px] border-b-[5px] border-b-school-green-sh',
          'bg-school-green py-4 font-sans text-[1.15em] font-bold text-white',
          'select-none touch-manipulation transition-all',
          'active:translate-y-[4px] active:border-b',
          'disabled:pointer-events-none disabled:opacity-40',
        ].join(' ')}
      >
        {tr.check}
      </button>
    </div>
  )
}
