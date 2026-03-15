import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GameDetailPage from '../GameDetailPage'
import type { Game } from '@/api/games'
import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'

vi.mock('@/api/games', () => ({
  getGame: vi.fn(),
  updateGame: vi.fn(),
}))

vi.mock('@/api/players', () => ({
  getPlayers: vi.fn(),
}))

vi.mock('@/api/availability', () => ({
  getAvailability: vi.fn(),
  createAvailability: vi.fn(),
  updateAvailability: vi.fn(),
}))

import { getGame, updateGame } from '@/api/games'
import { getPlayers } from '@/api/players'
import { getAvailability, createAvailability, updateAvailability } from '@/api/availability'

const game: Game = {
  id: 1,
  game_date: '2026-06-01',
  opponent: 'Red Sox',
  location: 'Fenway Park',
  is_home: false,
  status: 'scheduled',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const player: Player = {
  id: 10,
  name: 'Alice',
  jersey_number: '7',
  preferred_position: 'SS',
  capable_positions: ['SS'],
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const availabilityRecord: GameAvailability = {
  id: 5,
  game_id: 1,
  player_id: 10,
  is_available: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

function renderPage(gameId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/games/${gameId}`]}>
      <Routes>
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="/games" element={<div>Games List</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getGame).mockResolvedValue(game)
  vi.mocked(getPlayers).mockResolvedValue([player])
  vi.mocked(getAvailability).mockResolvedValue([])
  vi.mocked(updateGame).mockResolvedValue(game)
  vi.mocked(createAvailability).mockResolvedValue(availabilityRecord)
  vi.mocked(updateAvailability).mockResolvedValue({ ...availabilityRecord, is_available: false })
})

describe('GameDetailPage', () => {
  it('shows loading state on mount', () => {
    vi.mocked(getGame).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders game header after load', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/vs Red Sox/i)).toBeInTheDocument()
      expect(screen.getByText(/Fenway Park/i)).toBeInTheDocument()
    })
  })

  it('renders player rows in availability table', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  it('calls createAvailability when no prior record and checkbox checked', async () => {
    vi.mocked(getAvailability).mockResolvedValue([])
    renderPage()
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(createAvailability).toHaveBeenCalledWith(1, player.id, true)
    })
  })

  it('calls updateAvailability when prior record exists and checkbox toggled', async () => {
    vi.mocked(getAvailability).mockResolvedValue([availabilityRecord])
    renderPage()
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(updateAvailability).toHaveBeenCalledWith(1, availabilityRecord.id, false)
    })
  })

  it('refetches getAvailability after toggle', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Alice'))
    expect(getAvailability).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(getAvailability).toHaveBeenCalledTimes(2)
    })
  })

  it('shows error message when getGame rejects', async () => {
    vi.mocked(getGame).mockRejectedValue(new Error('Not found'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument()
    })
  })

  it('"Edit Game" button opens dialog pre-filled', async () => {
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    await userEvent.click(screen.getByRole('button', { name: /edit game/i }))
    expect(screen.getByRole('heading', { name: 'Edit Game' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Red Sox')).toBeInTheDocument()
  })

  it('submitting dialog calls updateGame then reloads', async () => {
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    await userEvent.click(screen.getByRole('button', { name: /edit game/i }))
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(updateGame).toHaveBeenCalledWith(1, expect.any(Object))
      expect(getGame).toHaveBeenCalledTimes(2)
    })
  })

  it('"← Games" navigates back to /games', async () => {
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    await userEvent.click(screen.getByRole('button', { name: /← games/i }))
    expect(screen.getByText('Games List')).toBeInTheDocument()
  })
})
