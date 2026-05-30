import { describe, it, expect } from 'vitest'
import { getMultiplier, calcPoints, getResultsTitleKey } from './scoring'

describe('getMultiplier', () => {
  it('returns 1 for free mode', ()   => expect(getMultiplier('free')).toBe(1))
  it('returns 3 for 5s mode',  ()   => expect(getMultiplier('5')).toBe(3))
  it('returns 2 for 10s mode', ()   => expect(getMultiplier('10')).toBe(2))
  it('returns 1.5 for 20s mode', () => expect(getMultiplier('20')).toBe(1.5))
})

describe('calcPoints', () => {
  it('returns 10 for streak 0, free mode', () => {
    expect(calcPoints(0, 'free')).toBe(10)
  })

  it('adds 2 per consecutive streak (streak = 1 → 12)', () => {
    expect(calcPoints(1, 'free')).toBe(12)
  })

  it('caps streak bonus at 10 (streak ≥ 10 → 30 base)', () => {
    // base 10 + min(10,10)*2 = 30, ×1 = 30
    expect(calcPoints(10, 'free')).toBe(30)
    expect(calcPoints(20, 'free')).toBe(30) // same — capped
  })

  it('multiplies by mode multiplier', () => {
    // streak 0 → 10 × 3 = 30
    expect(calcPoints(0, '5')).toBe(30)
    // streak 5 → (10 + 10) × 2 = 40
    expect(calcPoints(5, '10')).toBe(40)
    // streak 10 → 30 × 1.5 = 45
    expect(calcPoints(10, '20')).toBe(45)
  })

  it('rounds to nearest integer', () => {
    // 10 × 1.5 = 15 (exact)
    expect(calcPoints(0, '20')).toBe(15)
    // (10+2) × 1.5 = 18 (exact)
    expect(calcPoints(1, '20')).toBe(18)
  })
})

describe('getResultsTitleKey', () => {
  it('returns title_increible for 100% accuracy', () => {
    expect(getResultsTitleKey(20, 20)).toBe('title_increible')
  })

  it('returns title_increible at exactly 95%', () => {
    expect(getResultsTitleKey(19, 20)).toBe('title_increible')
  })

  it('returns title_molt_be between 80–94%', () => {
    expect(getResultsTitleKey(16, 20)).toBe('title_molt_be') // 80%
    expect(getResultsTitleKey(18, 20)).toBe('title_molt_be') // 90%
  })

  it('returns title_bona_feina between 60–79%', () => {
    expect(getResultsTitleKey(12, 20)).toBe('title_bona_feina') // 60%
    expect(getResultsTitleKey(15, 20)).toBe('title_bona_feina') // 75%
  })

  it('returns title_ben_fet between 40–59%', () => {
    expect(getResultsTitleKey(8, 20)).toBe('title_ben_fet') // 40%
    expect(getResultsTitleKey(11, 20)).toBe('title_ben_fet') // 55%
  })

  it('returns title_continua below 40%', () => {
    expect(getResultsTitleKey(7, 20)).toBe('title_continua')  // 35%
    expect(getResultsTitleKey(0, 20)).toBe('title_continua')  // 0%
  })

  it('handles zero total without crashing', () => {
    expect(getResultsTitleKey(0, 0)).toBe('title_continua')
  })
})
