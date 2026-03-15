import { apiFetch } from './client'

export interface Game {
  id: number
  game_date: string
  opponent: string
  location: string | null
  is_home: boolean
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface GameCreate {
  game_date: string
  opponent: string
  location?: string | null
  is_home?: boolean
  status?: 'scheduled' | 'completed' | 'cancelled'
}

export type GameUpdate = Partial<GameCreate>

export function getGames(): Promise<Game[]> {
  return apiFetch<Game[]>('/games/')
}

export function getGame(id: number): Promise<Game> {
  return apiFetch<Game>(`/games/${id}`)
}

export function createGame(data: GameCreate): Promise<Game> {
  return apiFetch<Game>('/games/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateGame(id: number, data: GameUpdate): Promise<Game> {
  return apiFetch<Game>(`/games/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteGame(id: number): Promise<void> {
  return apiFetch<void>(`/games/${id}`, { method: 'DELETE' })
}
