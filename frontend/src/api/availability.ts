import { apiFetch } from './client'

export interface GameAvailability {
  id: number
  game_id: number
  player_id: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export function getAvailability(gameId: number): Promise<GameAvailability[]> {
  return apiFetch<GameAvailability[]>(`/games/${gameId}/availability/`)
}

export function createAvailability(
  gameId: number,
  playerId: number,
  isAvailable: boolean,
): Promise<GameAvailability> {
  return apiFetch<GameAvailability>(`/games/${gameId}/availability/`, {
    method: 'POST',
    body: JSON.stringify({ player_id: playerId, is_available: isAvailable }),
  })
}

export function updateAvailability(
  gameId: number,
  availabilityId: number,
  isAvailable: boolean,
): Promise<GameAvailability> {
  return apiFetch<GameAvailability>(`/games/${gameId}/availability/${availabilityId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_available: isAvailable }),
  })
}
