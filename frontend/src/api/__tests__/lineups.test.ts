import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getLineups,
  createLineup,
  getLineup,
  createSlot,
  updateSlot,
  deleteSlot,
  reorderSlots,
} from '../lineups'
import * as client from '../client'

vi.mock('../client', () => ({ apiFetch: vi.fn() }))
const apiFetch = vi.mocked(client.apiFetch)

beforeEach(() => apiFetch.mockReset())

describe('getLineups', () => {
  it('calls GET /lineups/?game_id=1', async () => {
    apiFetch.mockResolvedValue([])
    await getLineups(1)
    expect(apiFetch).toHaveBeenCalledWith('/lineups/?game_id=1')
  })
})

describe('createLineup', () => {
  it('calls POST /lineups/ with game_id', async () => {
    apiFetch.mockResolvedValue({ id: 1, game_id: 1 })
    await createLineup({ game_id: 1 })
    expect(apiFetch).toHaveBeenCalledWith('/lineups/', {
      method: 'POST',
      body: JSON.stringify({ game_id: 1 }),
    })
  })
})

describe('getLineup', () => {
  it('calls GET /lineups/1', async () => {
    apiFetch.mockResolvedValue({ id: 1, slots: [] })
    await getLineup(1)
    expect(apiFetch).toHaveBeenCalledWith('/lineups/1')
  })
})

describe('createSlot', () => {
  it('calls POST /lineups/1/slots with slot data', async () => {
    const data = { player_id: 10, batting_order: 1, fielding_position: 'SS' }
    apiFetch.mockResolvedValue({ id: 1, ...data })
    await createSlot(1, data)
    expect(apiFetch).toHaveBeenCalledWith('/lineups/1/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  })
})

describe('updateSlot', () => {
  it('calls PATCH /lineups/1/slots/2 with update data', async () => {
    const data = { batting_order: 3 }
    apiFetch.mockResolvedValue({ id: 2, batting_order: 3 })
    await updateSlot(1, 2, data)
    expect(apiFetch).toHaveBeenCalledWith('/lineups/1/slots/2', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  })
})

describe('deleteSlot', () => {
  it('calls DELETE /lineups/1/slots/2', async () => {
    apiFetch.mockResolvedValue(undefined)
    await deleteSlot(1, 2)
    expect(apiFetch).toHaveBeenCalledWith('/lineups/1/slots/2', {
      method: 'DELETE',
    })
  })
})

describe('reorderSlots', () => {
  it('calls PUT /lineups/1/reorder with slot_ids', async () => {
    apiFetch.mockResolvedValue({ id: 1, slots: [] })
    await reorderSlots(1, [3, 1, 2])
    expect(apiFetch).toHaveBeenCalledWith('/lineups/1/reorder', {
      method: 'PUT',
      body: JSON.stringify({ slot_ids: [3, 1, 2] }),
    })
  })
})
