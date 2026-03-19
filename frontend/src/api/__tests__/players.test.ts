import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../players'
import * as client from '../client'

vi.mock('../client', () => ({ apiFetch: vi.fn() }))
const apiFetch = vi.mocked(client.apiFetch)

const mockPlayer = {
  id: 1,
  name: 'Alice',
  jersey_number: '7',
  capable_positions: ['SS', '2B'],
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

beforeEach(() => apiFetch.mockReset())

describe('getPlayers', () => {
  it('calls GET /players/', async () => {
    apiFetch.mockResolvedValue([mockPlayer])
    const result = await getPlayers()
    expect(apiFetch).toHaveBeenCalledWith('/players/')
    expect(result).toEqual([mockPlayer])
  })
})

describe('createPlayer', () => {
  it('calls POST /players/ with JSON body', async () => {
    apiFetch.mockResolvedValue(mockPlayer)
    await createPlayer({ name: 'Alice', jersey_number: '7' })
    expect(apiFetch).toHaveBeenCalledWith('/players/', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice', jersey_number: '7' }),
    })
  })
})

describe('updatePlayer', () => {
  it('calls PATCH /players/:id with JSON body', async () => {
    apiFetch.mockResolvedValue({ ...mockPlayer, is_active: false })
    await updatePlayer(1, { is_active: false })
    expect(apiFetch).toHaveBeenCalledWith('/players/1', {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    })
  })
})

describe('deletePlayer', () => {
  it('calls DELETE /players/:id', async () => {
    apiFetch.mockResolvedValue(undefined)
    await deletePlayer(1)
    expect(apiFetch).toHaveBeenCalledWith('/players/1', { method: 'DELETE' })
  })
})
