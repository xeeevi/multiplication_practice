import { describe, it, expect } from 'vitest'
import { getTranslations, t } from './index'
import ca from './ca'
import es from './es'
import en from './en'

// ── Key-parity guard — all languages must export identical keys ────────────

describe('key parity', () => {
  const caKeys = Object.keys(ca).sort()

  it('ES has the same keys as CA', () => {
    expect(Object.keys(es).sort()).toEqual(caKeys)
  })

  it('EN has the same keys as CA', () => {
    expect(Object.keys(en).sort()).toEqual(caKeys)
  })
})

// ── t() helper ─────────────────────────────────────────────────────────────

describe('t()', () => {
  it('returns the correct string for CA', () => {
    expect(t('ca', 'sel_all')).toBe('Totes')
  })

  it('returns the correct string for ES', () => {
    expect(t('es', 'sel_all')).toBe('Todas')
  })

  it('returns the correct string for EN', () => {
    expect(t('en', 'sel_all')).toBe('All')
  })

  it('returns the correct default_name for each language', () => {
    expect(t('ca', 'default_name')).toBe('Jugador')
    expect(t('es', 'default_name')).toBe('Jugador')
    expect(t('en', 'default_name')).toBe('Player')
  })
})

// ── Template functions ──────────────────────────────────────────────────────

describe('template functions', () => {
  it('timeout renders correctly', () => {
    const { timeout } = getTranslations('ca')
    expect(timeout(7, 8, 56)).toBe('Temps! 7 × 8 = 56')
  })

  it('timeout renders correctly in EN', () => {
    const { timeout } = getTranslations('en')
    expect(timeout(6, 9, 54)).toBe("Time's up! 6 × 9 = 54")
  })

  it('wrong_ans renders correctly', () => {
    const { wrong_ans } = getTranslations('ca')
    expect(wrong_ans(3, 4, 12)).toBe('3 × 4 = 12')
  })

  it('question_x_of_y renders correctly', () => {
    expect(t('ca', 'question_x_of_y')(5, 20)).toBe('Pregunta 5 de 20')
    expect(t('es', 'question_x_of_y')(5, 20)).toBe('Pregunta 5 de 20')
    expect(t('en', 'question_x_of_y')(5, 20)).toBe('Question 5 of 20')
  })

  it('lb_mode_timed renders correctly', () => {
    expect(t('ca', 'lb_mode_timed')('5')).toBe('5s/preg')
    expect(t('en', 'lb_mode_timed')('10')).toBe('10s/q')
  })
})

// ── Praise arrays ──────────────────────────────────────────────────────────

describe('praise arrays', () => {
  it('each language has at least one praise string', () => {
    (['ca', 'es', 'en'] as const).forEach((lang) => {
      const { praise } = getTranslations(lang)
      expect(praise.length).toBeGreaterThan(0)
      praise.forEach((p) => expect(typeof p).toBe('string'))
    })
  })
})
