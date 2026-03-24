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
  license_number: null,
  capable_positions: ['SS'],
  role: 'Player',
  status: 'Active',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const injuredPlayer: Player = { ...player, id: 2, name: 'Bob', jersey_number: null, status: 'Injured' }
const pregnantPlayer: Player = { ...player, id: 6, name: 'Faye', jersey_number: null, status: 'Pregnant' }
const staffPlayer: Player = { ...player, id: 3, name: 'Carol', role: 'Staff', status: 'Active' }
const inactivePlayer: Player = { ...player, id: 4, name: 'Dave', status: 'Inactive' }
const noRecordPlayer: Player = { ...player, id: 5, name: 'Eve', jersey_number: '5' }

function avail(playerId: number, isAvailable: boolean): GameAvailability {
  return {
    id: playerId * 10,
    game_id: 1,
    player_id: playerId,
    is_available: isAvailable,
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
  }
}

describe('AvailabilityPanel', () => {
  it('shows empty state when players array is empty', () => {
    render(<AvailabilityPanel players={[]} availability={[]} onToggle={vi.fn()} />)
    expect(screen.getByText('No players found.')).toBeInTheDocument()
  })

  it('places available active player in Available Players section', () => {
    render(<AvailabilityPanel players={[player]} availability={[avail(1, true)]} onToggle={vi.fn()} />)
    const section = screen.getByText(/available players/i).closest('div')!.parentElement!
    expect(section).toHaveTextContent('Alice')
  })

  it('places available inactive player in Available Players section', () => {
    render(<AvailabilityPanel players={[inactivePlayer]} availability={[avail(4, true)]} onToggle={vi.fn()} />)
    const section = screen.getByText(/available players/i).closest('div')!.parentElement!
    expect(section).toHaveTextContent('Dave')
  })

  it('places available injured player in Available (Non-Playing) section', () => {
    render(<AvailabilityPanel players={[injuredPlayer]} availability={[avail(2, true)]} onToggle={vi.fn()} />)
    const section = screen.getByText(/available \(non-playing\)/i).closest('div')!.parentElement!
    expect(section).toHaveTextContent('Bob')
  })

  it('places available pregnant player in Available (Non-Playing) section', () => {
    render(<AvailabilityPanel players={[pregnantPlayer]} availability={[avail(6, true)]} onToggle={vi.fn()} />)
    const section = screen.getByText(/available \(non-playing\)/i).closest('div')!.parentElement!
    expect(section).toHaveTextContent('Faye')
  })

  it('places available staff player in Available (Non-Playing) section', () => {
    render(<AvailabilityPanel players={[staffPlayer]} availability={[avail(3, true)]} onToggle={vi.fn()} />)
    const section = screen.getByText(/available \(non-playing\)/i).closest('div')!.parentElement!
    expect(section).toHaveTextContent('Carol')
  })

  it('places player with no record in Unavailable section', () => {
    render(<AvailabilityPanel players={[noRecordPlayer]} availability={[]} onToggle={vi.fn()} />)
    const section = screen.getByText(/unavailable/i).closest('div')!.parentElement!
    expect(section).toHaveTextContent('Eve')
  })

  it('places player with is_available=false in Unavailable section', () => {
    render(<AvailabilityPanel players={[player]} availability={[avail(1, false)]} onToggle={vi.fn()} />)
    const section = screen.getByText(/unavailable/i).closest('div')!.parentElement!
    expect(section).toHaveTextContent('Alice')
  })

  it('shows counts in section headers', () => {
    render(
      <AvailabilityPanel
        players={[player, noRecordPlayer]}
        availability={[avail(1, true)]}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByText(/available players \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/unavailable \(1\)/i)).toBeInTheDocument()
  })

  it('calls onToggle(id, recordId, false) when marking available player unavailable', async () => {
    const onToggle = vi.fn()
    render(<AvailabilityPanel players={[player]} availability={[avail(1, true)]} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /mark unavailable/i }))
    expect(onToggle).toHaveBeenCalledWith(1, 10, false)
  })

  it('calls onToggle(id, null, true) for player with no record', async () => {
    const onToggle = vi.fn()
    render(<AvailabilityPanel players={[noRecordPlayer]} availability={[]} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /mark available/i }))
    expect(onToggle).toHaveBeenCalledWith(5, null, true)
  })

  it('shows jersey number hint next to name', () => {
    render(<AvailabilityPanel players={[player]} availability={[avail(1, true)]} onToggle={vi.fn()} />)
    expect(screen.getByText('#7')).toBeInTheDocument()
  })

  it('shows no hint when jersey is null', () => {
    render(<AvailabilityPanel players={[injuredPlayer]} availability={[avail(2, false)]} onToggle={vi.fn()} />)
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument()
  })

  it('disables all toggle buttons when busy=true', () => {
    render(
      <AvailabilityPanel
        players={[player, noRecordPlayer]}
        availability={[avail(1, true)]}
        onToggle={vi.fn()}
        busy={true}
      />,
    )
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled())
  })
})
