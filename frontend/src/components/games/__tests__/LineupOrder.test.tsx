import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LineupOrder from '../LineupOrder'
import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'

const players: Player[] = [
  {
    id: 10,
    name: 'Alice',
    jersey_number: '7',
    preferred_position: 'SS',
    capable_positions: ['SS'],
    is_active: true,
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
  },
  {
    id: 20,
    name: 'Bob',
    jersey_number: null,
    preferred_position: 'CF',
    capable_positions: ['CF'],
    is_active: true,
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
  },
]

const slot1: LineupSlotRead = {
  id: 1,
  lineup_id: 1,
  player_id: 10,
  batting_order: 1,
  fielding_position: 'SS',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const slot2: LineupSlotRead = {
  id: 2,
  lineup_id: 1,
  player_id: 20,
  batting_order: 2,
  fielding_position: 'CF',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('LineupOrder', () => {
  it('shows empty state when no slots', () => {
    render(<LineupOrder slots={[]} players={players} />)
    expect(screen.getByText('No players assigned yet.')).toBeInTheDocument()
  })

  it('renders one row per slot', () => {
    render(<LineupOrder slots={[slot1, slot2]} players={players} />)
    expect(screen.getAllByRole('row').filter((r) => r.closest('tbody'))).toHaveLength(2)
  })

  it('renders player name and position in separate columns', () => {
    render(<LineupOrder slots={[slot1]} players={players} />)
    expect(screen.getByText('1. Alice')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'SS' })).toBeInTheDocument()
  })

  it('sorts slots by batting_order regardless of array order', () => {
    render(<LineupOrder slots={[slot2, slot1]} players={players} />)
    const rows = screen.getAllByRole('row').filter((r) => r.closest('tbody'))
    expect(rows[0]).toHaveTextContent('1. Alice')
    expect(rows[0]).toHaveTextContent('SS')
    expect(rows[1]).toHaveTextContent('2. Bob')
    expect(rows[1]).toHaveTextContent('CF')
  })

  it('shows "Unknown" for player not in players array', () => {
    const orphanSlot: LineupSlotRead = { ...slot1, id: 99, player_id: 999 }
    render(<LineupOrder slots={[orphanSlot]} players={players} />)
    expect(screen.getByText('1. Unknown')).toBeInTheDocument()
  })

  it('resolves name from players array', () => {
    render(<LineupOrder slots={[slot2]} players={players} />)
    // Only one slot rendered, so it always shows position 1 regardless of stored batting_order
    expect(screen.getByText('1. Bob')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'CF' })).toBeInTheDocument()
  })

  it('rows have draggable attribute', () => {
    render(<LineupOrder slots={[slot1, slot2]} players={players} onReorder={vi.fn()} />)
    const rows = screen.getAllByRole('row').filter((r) => r.closest('tbody'))
    rows.forEach((row) => expect(row).toHaveAttribute('draggable', 'true'))
  })
})
