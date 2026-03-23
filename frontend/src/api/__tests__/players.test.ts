import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../players'
import * as client from '../client'

vi.mock('../client', () => ({ apiFetch: vi.fn() }))
const apiFetch = vi.mocked(client.apiFetch)

const mockPlayer = {
  id: 1,
  name: 'Alice',
  jersey_number: '7',
  license_number: null,
  capable_positions: ['SS', '2B'],
  role: 'Player',
  status: 'Active',
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
    apiFetch.mockResolvedValue({ ...mockPlayer, status: 'Inactive' })
    await updatePlayer(1, { status: 'Inactive' })
    expect(apiFetch).toHaveBeenCalledWith('/players/1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Inactive' }),
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
