import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AvailabilityPanel from '../AvailabilityPanel'
import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'

const player: Player = {
  id: 1,
  name: 'Alice',
  jersey_number: '7',
  capable_positions: ['SS'],
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const playerNoJersey: Player = {
  ...player,
  id: 2,
  name: 'Bob',
  jersey_number: null,
}

const playerNoRecord: Player = {
  ...player,
  id: 3,
  name: 'Charlie',
  jersey_number: '5',
}

const availRecord: GameAvailability = {
  id: 10,
  game_id: 1,
  player_id: 1,
  is_available: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const unavailRecord: GameAvailability = {
  ...availRecord,
  id: 11,
  player_id: 2,
  is_available: false,
}

describe('AvailabilityPanel', () => {
  it('shows empty state when players array is empty', () => {
    render(<AvailabilityPanel players={[]} availability={[]} onToggle={vi.fn()} />)
    expect(screen.getByText('No players found.')).toBeInTheDocument()
  })

  it('places player with is_available=true in Available section', () => {
    render(<AvailabilityPanel players={[player]} availability={[availRecord]} onToggle={vi.fn()} />)
    const available = screen.getByText('Available').closest('div')!.parentElement!
    expect(available).toHaveTextContent('Alice')
  })

  it('places player with is_available=false in Unavailable section', () => {
    render(<AvailabilityPanel players={[playerNoJersey]} availability={[unavailRecord]} onToggle={vi.fn()} />)
    const unavailable = screen.getByText('Unavailable').closest('div')!.parentElement!
    expect(unavailable).toHaveTextContent('Bob')
  })

  it('places player with no record in Available section (available by default)', () => {
    render(<AvailabilityPanel players={[playerNoRecord]} availability={[]} onToggle={vi.fn()} />)
    const available = screen.getByText('Available').closest('div')!.parentElement!
    expect(available).toHaveTextContent('Charlie')
  })

  it('calls onToggle(id, recordId, false) when marking available player unavailable', async () => {
    const onToggle = vi.fn()
    render(<AvailabilityPanel players={[player]} availability={[availRecord]} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /mark unavailable/i }))
    expect(onToggle).toHaveBeenCalledWith(1, 10, false)
  })

  it('calls onToggle(id, null, false) for player with no record (marks unavailable from default)', async () => {
    const onToggle = vi.fn()
    render(<AvailabilityPanel players={[playerNoRecord]} availability={[]} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /mark unavailable/i }))
    expect(onToggle).toHaveBeenCalledWith(3, null, false)
  })

  it('calls onToggle(id, recordId, true) for player with false record', async () => {
    const onToggle = vi.fn()
    render(<AvailabilityPanel players={[playerNoJersey]} availability={[unavailRecord]} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /mark available/i }))
    expect(onToggle).toHaveBeenCalledWith(2, 11, true)
  })

  it('shows jersey number hint next to name', () => {
    render(<AvailabilityPanel players={[player]} availability={[availRecord]} onToggle={vi.fn()} />)
    expect(screen.getByText('#7')).toBeInTheDocument()
  })

  it('shows no hint when jersey is null', () => {
    render(<AvailabilityPanel players={[playerNoJersey]} availability={[unavailRecord]} onToggle={vi.fn()} />)
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument()
  })

  it('disables all toggle buttons when busy=true', () => {
    render(
      <AvailabilityPanel
        players={[player, playerNoJersey]}
        availability={[availRecord, unavailRecord]}
        onToggle={vi.fn()}
        busy={true}
      />,
    )
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled())
  })
})
