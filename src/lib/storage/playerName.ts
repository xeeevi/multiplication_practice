import { STORAGE_KEYS } from '../game/constants'

export function loadPlayerName(): string {
  return localStorage.getItem(STORAGE_KEYS.playerName) ?? ''
}

export function savePlayerName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.playerName, name.trim())
}
