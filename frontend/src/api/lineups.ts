import { apiFetch } from './client'

export interface LineupRead {
  id: number
  game_id: number
  name: string
  is_final: boolean
  created_at: string
  updated_at: string
}

export interface LineupSlotRead {
  id: number
  lineup_id: number
  player_id: number
  batting_order: number
  fielding_position: string
  is_flex: boolean
  created_at: string
  updated_at: string
}

export interface LineupReadWithSlots extends LineupRead {
  slots: LineupSlotRead[]
}

export interface LineupSlotCreate {
  player_id: number
  batting_order: number
  fielding_position: string
  is_flex?: boolean
}

export interface LineupSlotUpdate {
  batting_order?: number
  fielding_position?: string
  is_flex?: boolean
}

export function getLineups(gameId: number): Promise<LineupRead[]> {
  return apiFetch<LineupRead[]>(`/lineups/?game_id=${gameId}`)
}

export function createLineup(data: { game_id: number }): Promise<LineupRead> {
  return apiFetch<LineupRead>('/lineups/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getLineup(id: number): Promise<LineupReadWithSlots> {
  return apiFetch<LineupReadWithSlots>(`/lineups/${id}`)
}

export function createSlot(
  lineupId: number,
  data: LineupSlotCreate,
): Promise<LineupSlotRead> {
  return apiFetch<LineupSlotRead>(`/lineups/${lineupId}/slots`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateSlot(
  lineupId: number,
  slotId: number,
  data: LineupSlotUpdate,
): Promise<LineupSlotRead> {
  return apiFetch<LineupSlotRead>(`/lineups/${lineupId}/slots/${slotId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteSlot(
  lineupId: number,
  slotId: number,
): Promise<LineupReadWithSlots> {
  return apiFetch<LineupReadWithSlots>(`/lineups/${lineupId}/slots/${slotId}`, {
    method: 'DELETE',
  })
}

export function reorderSlots(
  lineupId: number,
  slotIds: number[],
): Promise<LineupReadWithSlots> {
  return apiFetch<LineupReadWithSlots>(`/lineups/${lineupId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ slot_ids: slotIds }),
  })
}
