import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LineupOrder from '../LineupOrder'
import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'

const players: Player[] = [
  {
    id: 10,
    name: 'Alice',
    jersey_number: '7',
  license_number: null,
      capable_positions: ['SS'],
    role: 'Player',
  status: 'Active',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
  },
  {
    id: 20,
    name: 'Bob',
    jersey_number: null,
  license_number: null,
      capable_positions: ['CF'],
    role: 'Player',
  status: 'Active',
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
  is_flex: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const slot2: LineupSlotRead = {
  id: 2,
  lineup_id: 1,
  player_id: 20,
  batting_order: 2,
  fielding_position: 'CF',
  is_flex: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('LineupOrder', () => {
  it('shows empty state when no slots and no available players', () => {
    render(<LineupOrder slots={[]} players={players} availablePlayers={[]} />)
    expect(screen.getByText('Mark players available, then assign them from the diamond.')).toBeInTheDocument()
  })

  it('shows batting order prompt when slots empty but bench players exist', () => {
    render(<LineupOrder slots={[]} players={players} availablePlayers={[players[0]]} />)
    expect(screen.getByText('Assign players from the diamond to build the batting order.')).toBeInTheDocument()
  })

  it('renders one row per slot', () => {
    render(<LineupOrder slots={[slot1, slot2]} players={players} availablePlayers={[]} />)
    expect(within(document.querySelector('tbody')!).getAllByRole('row')).toHaveLength(2)
  })

  it('renders player name and position in separate columns', () => {
    render(<LineupOrder slots={[slot1]} players={players} availablePlayers={[]} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'SS' })).toBeInTheDocument()
  })

  it('sorts slots by batting_order regardless of array order', () => {
    render(<LineupOrder slots={[slot2, slot1]} players={players} availablePlayers={[]} />)
    const rows = within(document.querySelector('tbody')!).getAllByRole('row')
    expect(rows[0]).toHaveTextContent('Alice')
    expect(rows[0]).toHaveTextContent('SS')
    expect(rows[1]).toHaveTextContent('Bob')
    expect(rows[1]).toHaveTextContent('CF')
  })

  it('shows "Unknown" for player not in players array', () => {
    const orphanSlot: LineupSlotRead = { ...slot1, id: 99, player_id: 999 }
    render(<LineupOrder slots={[orphanSlot]} players={players} availablePlayers={[]} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('resolves name from players array', () => {
    render(<LineupOrder slots={[slot2]} players={players} availablePlayers={[]} />)
    expect(screen.getByText('Bob')).toBeInTheDocument()
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

  describe('DH / Flex', () => {
    const flexSlot: LineupSlotRead = { ...slot1, id: 3, is_flex: true, batting_order: 2 }
    const dhSlot: LineupSlotRead = { ...slot2, id: 4, fielding_position: 'DH', batting_order: 1 }

    it('shows Flex player at position 10 below the batting order table', () => {
      render(<LineupOrder slots={[slot2, flexSlot]} players={players} availablePlayers={[]} />)
      expect(screen.getByText('10.')).toBeInTheDocument()
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    })

    it('Flex player does not appear as a numbered row in the batting table', () => {
      render(<LineupOrder slots={[flexSlot]} players={players} availablePlayers={[]} />)
      // The flex row appears outside the table (no numbered batting slot)
      expect(screen.queryByRole('row', { name: /Alice/ })).not.toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('DH player appears in the regular batting order table', () => {
      render(<LineupOrder slots={[dhSlot]} players={players} availablePlayers={[]} />)
      const tbody = document.querySelector('tbody')!
      expect(within(tbody).getByText('Bob')).toBeInTheDocument()
      expect(within(tbody).getByText('DH')).toBeInTheDocument()
    })

    it('shows F badge on the Flex row', () => {
      render(<LineupOrder slots={[slot2, flexSlot]} players={players} availablePlayers={[]} />)
      // "F" badge appears in the flex row section (not the button)
      const flexBadges = screen.getAllByText('F')
      expect(flexBadges.length).toBeGreaterThan(0)
    })

    it('shows DH warning when flex set but no DH', () => {
      render(<LineupOrder slots={[flexSlot]} players={players} availablePlayers={[]} />)
      expect(screen.getByText(/assign a dh from the bench/i)).toBeInTheDocument()
    })

    it('shows Flex warning when DH set but no flex', () => {
      render(<LineupOrder slots={[dhSlot]} players={players} availablePlayers={[]} />)
      expect(screen.getByText(/mark a defensive player as flex/i)).toBeInTheDocument()
    })

    it('shows no warning when neither DH nor Flex is set', () => {
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={[]} />)
      expect(screen.queryByText(/assign a dh/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/mark a defensive/i)).not.toBeInTheDocument()
    })

    it('shows DH button on bench players when no DH assigned', () => {
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={players} />)
      expect(screen.getByRole('button', { name: /assign bob as dh/i })).toBeInTheDocument()
    })

    it('hides DH button on bench when DH already assigned', () => {
      render(<LineupOrder slots={[slot1, dhSlot]} players={players} availablePlayers={players} />)
      expect(screen.queryByRole('button', { name: /assign.*dh/i })).not.toBeInTheDocument()
    })

    it('calls onAssignDH with player id when DH button clicked', async () => {
      const onAssignDH = vi.fn()
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={players} onAssignDH={onAssignDH} />)
      await userEvent.click(screen.getByRole('button', { name: /assign bob as dh/i }))
      expect(onAssignDH).toHaveBeenCalledWith(20)
    })

    it('calls onSetFlex when F button clicked on a row', async () => {
      const onSetFlex = vi.fn()
      render(<LineupOrder slots={[slot1]} players={players} availablePlayers={[]} onSetFlex={onSetFlex} />)
      await userEvent.click(screen.getByRole('button', { name: /mark as flex/i }))
      expect(onSetFlex).toHaveBeenCalledWith(1, true)
    })

    it('calls onUnassignFlex when × clicked on the Flex row', async () => {
      const onUnassignFlex = vi.fn()
      render(<LineupOrder slots={[flexSlot]} players={players} availablePlayers={[]} onUnassignFlex={onUnassignFlex} />)
      await userEvent.click(screen.getByRole('button', { name: /unmark flex/i }))
      expect(onUnassignFlex).toHaveBeenCalledWith(3)
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
      expect(screen.getByText('Mark players available, then assign them from the diamond.')).toBeInTheDocument()
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
      // Bob has no positions — no position abbreviation should appear next to his name
      expect(within(bench).queryByText('CF')).not.toBeInTheDocument()
    })
  })
})
