import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
    render(<LineupOrder slots={[]} players={players} availablePlayers={[]} />)
    expect(screen.getByText('No players assigned yet.')).toBeInTheDocument()
  })

  it('renders one row per slot', () => {
    render(<LineupOrder slots={[slot1, slot2]} players={players} availablePlayers={[]} />)
    expect(within(document.querySelector('tbody')!).getAllByRole('row')).toHaveLength(2)
  })

  it('renders player name and position in separate columns', () => {
    render(<LineupOrder slots={[slot1]} players={players} availablePlayers={[]} />)
    expect(screen.getByText('1. Alice')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'SS' })).toBeInTheDocument()
  })

  it('sorts slots by batting_order regardless of array order', () => {
    render(<LineupOrder slots={[slot2, slot1]} players={players} availablePlayers={[]} />)
    const rows = within(document.querySelector('tbody')!).getAllByRole('row')
    expect(rows[0]).toHaveTextContent('1. Alice')
    expect(rows[0]).toHaveTextContent('SS')
    expect(rows[1]).toHaveTextContent('2. Bob')
    expect(rows[1]).toHaveTextContent('CF')
  })

  it('shows "Unknown" for player not in players array', () => {
    const orphanSlot: LineupSlotRead = { ...slot1, id: 99, player_id: 999 }
    render(<LineupOrder slots={[orphanSlot]} players={players} availablePlayers={[]} />)
    expect(screen.getByText('1. Unknown')).toBeInTheDocument()
  })

  it('resolves name from players array', () => {
    render(<LineupOrder slots={[slot2]} players={players} availablePlayers={[]} />)
    // Only one slot rendered, so it always shows position 1 regardless of stored batting_order
    expect(screen.getByText('1. Bob')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'CF' })).toBeInTheDocument()
  })

  it('accepts onReorder callback prop without error', () => {
    const onReorder = vi.fn()
    render(<LineupOrder slots={[slot1, slot2]} players={players} availablePlayers={[]} onReorder={onReorder} />)
    // Verify component renders correctly with callback prop
    expect(within(document.querySelector('tbody')!).getAllByRole('row')).toHaveLength(2)
  })

  describe('out-of-position label', () => {
    it('position label is amber when player is not capable at assigned position', () => {
      const outOfPosSlot: LineupSlotRead = { ...slot1, fielding_position: 'P' } // Alice not capable at P
      render(<LineupOrder slots={[outOfPosSlot]} players={players} availablePlayers={[]} />)
      const cell = screen.getByRole('cell', { name: 'P' })
      expect(cell).toHaveClass('text-amber-600')
    })

    it('position label is muted when player is capable at assigned position', () => {
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={[]} />)
      const cell = screen.getByRole('cell', { name: 'SS' })
      expect(cell).toHaveClass('text-muted-foreground')
      expect(cell).not.toHaveClass('text-amber-600')
    })

    it('position label is muted for unknown player', () => {
      const orphanSlot: LineupSlotRead = { ...slot1, id: 99, player_id: 999 }
      render(<LineupOrder slots={[orphanSlot]} players={players} availablePlayers={[]} />)
      const cell = screen.getByRole('cell', { name: 'SS' })
      expect(cell).toHaveClass('text-muted-foreground')
      expect(cell).not.toHaveClass('text-amber-600')
    })
  })

  describe('bench section', () => {
    it('shows bench players not in slots', () => {
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={players} />)
      expect(screen.getByText('Bench')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('does not show slotted player in bench', () => {
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={players} />)
      const bench = screen.getByText('Bench').closest('div')!
      expect(within(bench).queryByText('Alice')).not.toBeInTheDocument()
    })

    it('hides bench section when all available are slotted', () => {
      render(<LineupOrder slots={[slot1, slot2]} players={players} availablePlayers={players} />)
      expect(screen.queryByText('Bench')).not.toBeInTheDocument()
    })

    it('shows only bench when slots is empty', () => {
      render(<LineupOrder slots={[]} players={players} availablePlayers={[players[0]]} />)
      expect(screen.getByText('Bench')).toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(document.querySelector('table')).not.toBeInTheDocument()
    })

    it('shows empty state when slots empty and no available players', () => {
      render(<LineupOrder slots={[]} players={players} availablePlayers={[]} />)
      expect(screen.getByText('No players assigned yet.')).toBeInTheDocument()
    })

    it('shows capable positions next to bench player name', () => {
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={players} />)
      const bench = screen.getByText('Bench').closest('div')!
      expect(within(bench).getByText('CF')).toBeInTheDocument()
    })

    it('does not show position hint when capable_positions is null', () => {
      const noPosBob: Player = { ...players[1], capable_positions: null }
      render(<LineupOrder slots={[slot1]} players={[players[0], noPosBob]} availablePlayers={[players[0], noPosBob]} />)
      const bench = screen.getByText('Bench').closest('div')!
      // Bob row should not contain any position abbreviation span
      const bobItem = within(bench).getByText('Bob')
      expect(bobItem.nextSibling).toBeNull()
    })
  })
})
