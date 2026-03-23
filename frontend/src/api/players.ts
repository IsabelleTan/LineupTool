import { apiFetch } from './client'

export interface Player {
  id: number
  name: string
  jersey_number: string | null
  license_number: string | null
  capable_positions: string[] | null
  role: string
  status: string
  created_at: string
  updated_at: string
}

export interface PlayerCreate {
  name: string
  jersey_number?: string | null
  license_number?: string | null
  capable_positions?: string[] | null
  role?: string
  status?: string
}

export interface PlayerUpdate {
  name?: string
  jersey_number?: string | null
  license_number?: string | null
  capable_positions?: string[] | null
  role?: string
  status?: string
}

export function getPlayers(): Promise<Player[]> {
  return apiFetch<Player[]>('/players/')
}

export function createPlayer(data: PlayerCreate): Promise<Player> {
  return apiFetch<Player>('/players/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updatePlayer(id: number, data: PlayerUpdate): Promise<Player> {
  return apiFetch<Player>(`/players/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deletePlayer(id: number): Promise<void> {
  return apiFetch<void>(`/players/${id}`, { method: 'DELETE' })
}
