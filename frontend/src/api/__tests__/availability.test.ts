import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAvailability, createAvailability, updateAvailability } from '../availability'
import * as client from '../client'

vi.mock('../client', () => ({ apiFetch: vi.fn() }))
const apiFetch = vi.mocked(client.apiFetch)

const mockAvailability = {
  id: 5,
  game_id: 1,
  player_id: 10,
  is_available: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

beforeEach(() => apiFetch.mockReset())

describe('getAvailability', () => {
  it('calls GET /games/1/availability/', async () => {
    apiFetch.mockResolvedValue([mockAvailability])
    const result = await getAvailability(1)
    expect(apiFetch).toHaveBeenCalledWith('/games/1/availability/')
    expect(result).toEqual([mockAvailability])
  })
})

describe('createAvailability', () => {
  it('calls POST /games/1/availability/ with player_id and is_available', async () => {
    apiFetch.mockResolvedValue(mockAvailability)
    await createAvailability(1, 10, true)
    expect(apiFetch).toHaveBeenCalledWith('/games/1/availability/', {
      method: 'POST',
      body: JSON.stringify({ player_id: 10, is_available: true }),
    })
  })
})

describe('updateAvailability', () => {
  it('calls PATCH /games/1/availability/5 with is_available', async () => {
    apiFetch.mockResolvedValue({ ...mockAvailability, is_available: false })
    await updateAvailability(1, 5, false)
    expect(apiFetch).toHaveBeenCalledWith('/games/1/availability/5', {
      method: 'PATCH',
      body: JSON.stringify({ is_available: false }),
    })
  })
})
