import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function abbreviateName(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts[0][0]}. ${last}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// No record → available by default; only an explicit false makes a player unavailable.
export function isPlayerAvailable(player: Player, availability: GameAvailability[]): boolean {
  const record = availability.find((a) => a.player_id === player.id)
  return !record || record.is_available === true
}
