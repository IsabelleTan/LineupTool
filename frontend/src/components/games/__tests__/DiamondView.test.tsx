import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiamondView from '../DiamondView'
import { abbreviateName } from '@/lib/utils'
import type { Player } from '@/api/players'
import type { LineupSlotRead } from '@/api/lineups'

const alice: Player = {
  id: 10,
  name: 'Alice Smith',
  jersey_number: '7',
  preferred_position: 'SS',
  capable_positions: ['SS', 'CF'],
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const bob: Player = {
  id: 20,
  name: 'Bob',
  jersey_number: null,
  preferred_position: 'P',
  capable_positions: ['P'],
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const playerNoPositions: Player = {
  ...bob,
  id: 30,
  name: 'Dave',
  capable_positions: null,
}

const slotSS: LineupSlotRead = {
  id: 1,
  lineup_id: 1,
  player_id: 10,
  batting_order: 1,
  fielding_position: 'SS',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

function renderDiamond(overrides: Partial<Parameters<typeof DiamondView>[0]> = {}) {
  return render(
    <DiamondView
      availablePlayers={[alice]}
      slots={[]}
      onAssign={vi.fn()}
      onUnassign={vi.fn()}
      busy={false}
      {...overrides}
    />,
  )
}

describe('DiamondView', () => {
  it('renders all 9 position labels', () => {
    renderDiamond({ availablePlayers: [] })
    for (const pos of ['CF', 'LF', 'RF', 'SS', '2B', '3B', '1B', 'P', 'C']) {
      expect(screen.getByText(pos)).toBeInTheDocument()
    }
  })

  it('shows player card at SS for available player with capable_positions ["SS"]', () => {
    const playerSS: Player = { ...alice, capable_positions: ['SS'] }
    renderDiamond({ availablePlayers: [playerSS], slots: [] })
    expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument()
  })

  it('player not in availablePlayers does not appear', () => {
    renderDiamond({ availablePlayers: [] })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('assigned-here card gets blue styling', () => {
    renderDiamond({ availablePlayers: [alice], slots: [slotSS] })
    const card = screen.getAllByRole('button').find(
      (b) => b.textContent === 'Alice' && b.className.includes('bg-blue-500'),
    )
    expect(card).toBeTruthy()
  })

  it('taken card gets greyed styling (pointer-events-none)', () => {
    const slotCF: LineupSlotRead = { ...slotSS, id: 2, fielding_position: 'CF' }
    renderDiamond({ availablePlayers: [alice], slots: [slotCF] })
    // At SS, alice is taken elsewhere — renders as grey non-interactive div
    const greyCards = document.querySelectorAll('.pointer-events-none')
    expect(greyCards.length).toBeGreaterThan(0)
  })

  it('clicking available card calls onAssign(playerId, position)', async () => {
    const onAssign = vi.fn()
    const playerSS: Player = { ...alice, capable_positions: ['SS'] }
    renderDiamond({ availablePlayers: [playerSS], slots: [], onAssign })
    await userEvent.click(screen.getByRole('button', { name: 'Alice' }))
    expect(onAssign).toHaveBeenCalledWith(10, 'SS')
  })

  it('clicking assigned-here card calls onUnassign(slotId)', async () => {
    const onUnassign = vi.fn()
    renderDiamond({ availablePlayers: [alice], slots: [slotSS], onUnassign })
    const buttons = screen.getAllByRole('button', { name: 'Alice' })
    const blueButton = buttons.find((b) => b.className.includes('bg-blue-500'))!
    await userEvent.click(blueButton)
    expect(onUnassign).toHaveBeenCalledWith(slotSS.id)
  })

  it('busy=true disables all cards', () => {
    renderDiamond({ availablePlayers: [alice], slots: [], busy: true })
    const buttons = screen.getAllByRole('button')
    buttons.forEach((b) => expect(b).toBeDisabled())
  })

  it('player with capable_positions null appears at no position', () => {
    renderDiamond({ availablePlayers: [playerNoPositions], slots: [] })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('player with multiple capable positions appears at each one', () => {
    // alice has ['SS', 'CF']
    renderDiamond({ availablePlayers: [alice], slots: [] })
    const buttons = screen.getAllByRole('button', { name: 'Alice' })
    expect(buttons).toHaveLength(2)
  })

  it('shows first+last name when two players share a first name at the same position', () => {
    const alice2: Player = { ...alice, id: 99, name: 'Alice Jones', capable_positions: ['SS'] }
    const alice1: Player = { ...alice, capable_positions: ['SS'] }
    renderDiamond({ availablePlayers: [alice1, alice2], slots: [] })
    expect(screen.getByRole('button', { name: 'Alice Smith' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alice Jones' })).toBeInTheDocument()
  })
})

describe('abbreviateName', () => {
  it('"Alice Smith" → "A. Smith"', () => {
    expect(abbreviateName('Alice Smith')).toBe('A. Smith')
  })

  it('single word unchanged', () => {
    expect(abbreviateName('Bob')).toBe('Bob')
  })

  it('empty string → "?"', () => {
    expect(abbreviateName('')).toBe('?')
  })

  it('multi-word uses last word', () => {
    expect(abbreviateName('Mary Jane Watson')).toBe('M. Watson')
  })
})
