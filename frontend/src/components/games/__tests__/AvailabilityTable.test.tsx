import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AvailabilityTable from '../AvailabilityTable'
import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'

const player1: Player = {
  id: 10,
  name: 'Alice',
  jersey_number: '7',
  preferred_position: 'SS',
  capable_positions: ['SS', '2B'],
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const player2: Player = {
  id: 11,
  name: 'Bob',
  jersey_number: null,
  preferred_position: null,
  capable_positions: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const availableRecord: GameAvailability = {
  id: 5,
  game_id: 1,
  player_id: 10,
  is_available: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const unavailableRecord: GameAvailability = {
  id: 6,
  game_id: 1,
  player_id: 11,
  is_available: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('AvailabilityTable', () => {
  it('shows empty state when players array is empty', () => {
    render(<AvailabilityTable players={[]} availability={[]} onToggle={vi.fn()} />)
    expect(screen.getByText(/no players found/i)).toBeInTheDocument()
  })

  it('renders a row per player', () => {
    render(
      <AvailabilityTable players={[player1, player2]} availability={[]} onToggle={vi.fn()} />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('checkbox is checked when availability record has is_available: true', () => {
    render(
      <AvailabilityTable
        players={[player1]}
        availability={[availableRecord]}
        onToggle={vi.fn()}
      />,
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('checkbox is unchecked when no availability record exists', () => {
    render(
      <AvailabilityTable players={[player1]} availability={[]} onToggle={vi.fn()} />,
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('checkbox is unchecked when is_available is false', () => {
    render(
      <AvailabilityTable
        players={[player2]}
        availability={[unavailableRecord]}
        onToggle={vi.fn()}
      />,
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('calls onToggle with (playerId, null, true) when no record exists and checkbox checked', async () => {
    const onToggle = vi.fn()
    render(
      <AvailabilityTable players={[player1]} availability={[]} onToggle={onToggle} />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(player1.id, null, true)
  })

  it('calls onToggle with (playerId, recordId, false) when record exists and checkbox unchecked', async () => {
    const onToggle = vi.fn()
    render(
      <AvailabilityTable
        players={[player1]}
        availability={[availableRecord]}
        onToggle={onToggle}
      />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(player1.id, availableRecord.id, false)
  })
})
