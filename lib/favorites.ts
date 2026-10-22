import { useSyncExternalStore } from 'react'

export const FAVORITES_KEY = 'devoven:favorites'
const CHANGE_EVENT = 'devoven:favorites-changed'

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(FAVORITES_KEY)
  } catch {
    return null
  }
}

function subscribe(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function parseFavorites(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value)
      ? [...new Set(value.filter((link): link is string => typeof link === 'string' && /^\/[a-z0-9/-]+$/.test(link)))]
      : []
  } catch {
    return []
  }
}

export function useFavorites(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null)
  return parseFavorites(raw)
}

export function toggleFavorite(link: string): void {
  try {
    const current = parseFavorites(getSnapshot())
    const next = current.includes(link)
      ? current.filter((item) => item !== link)
      : [...current, link]
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    // Favorites remain optional if browser storage is unavailable.
  }
}
