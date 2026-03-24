import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getGames, createGame, updateGame, deleteGame } from '../games'
import * as client from '../client'

vi.mock('../client', () => ({ apiFetch: vi.fn() }))
const apiFetch = vi.mocked(client.apiFetch)

const mockGame = {
  id: 1,
  game_date: '2026-06-01',
  opponent: 'Red Sox',
  location: 'Fenway Park',
  is_home: false,
  game_number: null,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

beforeEach(() => apiFetch.mockReset())

describe('getGames', () => {
  it('calls GET /games/', async () => {
    apiFetch.mockResolvedValue([mockGame])
    const result = await getGames()
    expect(apiFetch).toHaveBeenCalledWith('/games/')
    expect(result).toEqual([mockGame])
  })
})

describe('createGame', () => {
  it('calls POST /games/ with JSON body', async () => {
    apiFetch.mockResolvedValue(mockGame)
    await createGame({ game_date: '2026-06-01', opponent: 'Red Sox' })
    expect(apiFetch).toHaveBeenCalledWith('/games/', {
      method: 'POST',
      body: JSON.stringify({ game_date: '2026-06-01', opponent: 'Red Sox' }),
    })
  })
})

describe('updateGame', () => {
  it('calls PATCH /games/:id with JSON body', async () => {
    apiFetch.mockResolvedValue({ ...mockGame, opponent: 'Yankees' })
    await updateGame(1, { opponent: 'Yankees' })
    expect(apiFetch).toHaveBeenCalledWith('/games/1', {
      method: 'PATCH',
      body: JSON.stringify({ opponent: 'Yankees' }),
    })
  })
})

describe('deleteGame', () => {
  it('calls DELETE /games/:id', async () => {
    apiFetch.mockResolvedValue(undefined)
    await deleteGame(1)
    expect(apiFetch).toHaveBeenCalledWith('/games/1', { method: 'DELETE' })
  })
})
