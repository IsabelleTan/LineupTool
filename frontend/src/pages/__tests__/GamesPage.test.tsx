import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import GamesPage from '../GamesPage'
import type { Game } from '@/api/games'

vi.mock('@/api/games', () => ({
  getGames: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  deleteGame: vi.fn(),
}))

vi.mock('@/api/availability', () => ({
  getAvailability: vi.fn(),
  createAvailability: vi.fn(),
}))

vi.mock('@/api/lineups', () => ({
  getLineups: vi.fn(),
  getLineup: vi.fn(),
  createLineup: vi.fn(),
  createSlot: vi.fn(),
}))

import { getGames, createGame, updateGame, deleteGame } from '@/api/games'
import { getAvailability, createAvailability } from '@/api/availability'
import { getLineups, getLineup, createLineup, createSlot } from '@/api/lineups'

const game1: Game = {
  id: 1,
  game_date: '2026-06-01',
  opponent: 'Red Sox',
  location: 'Fenway Park',
  is_home: false,
  game_number: null,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const game2: Game = {
  id: 2,
  game_date: '2024-07-04',
  opponent: 'Yankees',
  location: null,
  is_home: true,
  game_number: null,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getGames).mockResolvedValue([game1, game2])
  vi.mocked(getAvailability).mockResolvedValue([])
  vi.mocked(createAvailability).mockResolvedValue({ id: 1, game_id: 99, player_id: 1, is_available: true, created_at: '', updated_at: '' })
  vi.mocked(getLineups).mockResolvedValue([])
  vi.mocked(getLineup).mockResolvedValue({ id: 1, game_id: 1, name: 'Default', is_final: false, created_at: '', updated_at: '', slots: [] })
  vi.mocked(createLineup).mockResolvedValue({ id: 1, game_id: 99, name: 'Default', is_final: false, created_at: '', updated_at: '' })
  vi.mocked(createSlot).mockResolvedValue({ id: 1, lineup_id: 1, player_id: 1, batting_order: 1, fielding_position: 'SS', created_at: '', updated_at: '' })
})

describe('GamesPage', () => {
  it('shows loading state on initial mount', () => {
    vi.mocked(getGames).mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows future games under Upcoming Games and past games under Past Games', async () => {
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    expect(screen.getByRole('heading', { name: 'Upcoming Games' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Past Games' })).toBeInTheDocument()
    expect(screen.getByText('Red Sox')).toBeInTheDocument()
    expect(screen.getByText('Yankees')).toBeInTheDocument()
  })

  it('"Add Game" button opens the dialog', async () => {
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    expect(screen.getByRole('heading', { name: 'Add Game' })).toBeInTheDocument()
  })

  it('Edit button opens dialog pre-filled with the game', async () => {
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    expect(screen.getByRole('heading', { name: 'Edit Game' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Red Sox')).toBeInTheDocument()
  })

  it('Delete button calls deleteGame and reloads', async () => {
    vi.mocked(deleteGame).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    await waitFor(() => {
      expect(deleteGame).toHaveBeenCalledWith(game1.id)
    })
  })

  it('cancel confirm does not call deleteGame', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    expect(deleteGame).not.toHaveBeenCalled()
  })

  it('submit in add mode calls createGame', async () => {
    vi.mocked(createGame).mockResolvedValue({ ...game1, id: 3, opponent: 'Cubs' })
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await waitFor(() => {
      expect(createGame).toHaveBeenCalledWith(expect.objectContaining({ opponent: 'Cubs' }))
      expect(updateGame).not.toHaveBeenCalled()
    })
  })

  it('submit in edit mode calls updateGame', async () => {
    vi.mocked(updateGame).mockResolvedValue({ ...game1, opponent: 'Red Sox Updated' })
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(updateGame).toHaveBeenCalledWith(game1.id, expect.any(Object))
      expect(createGame).not.toHaveBeenCalled()
    })
  })

  it('getGames is refetched after successful submit', async () => {
    vi.mocked(createGame).mockResolvedValue({ ...game1, id: 3, opponent: 'Cubs' })
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    expect(getGames).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await waitFor(() => {
      expect(getGames).toHaveBeenCalledTimes(2)
    })
  })

  it('shows error message when getGames rejects', async () => {
    vi.mocked(getGames).mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows error in dialog when createGame rejects', async () => {
    vi.mocked(createGame).mockRejectedValue(new Error('Server error'))
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('Duplicate button calls createGame with same date/opponent/location/is_home but no game_number', async () => {
    vi.mocked(createGame).mockResolvedValue({ ...game1, id: 3, game_number: null })
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    const dupButtons = screen.getAllByRole('button', { name: /duplicate/i })
    await userEvent.click(dupButtons[0])
    await waitFor(() => {
      expect(createGame).toHaveBeenCalledWith({
        game_date: game1.game_date,
        opponent: game1.opponent,
        location: game1.location,
        is_home: game1.is_home,
      })
    })
  })

  it('Duplicate copies availability records to the new game', async () => {
    const newGame = { ...game1, id: 3, game_number: null }
    vi.mocked(createGame).mockResolvedValue(newGame)
    vi.mocked(getAvailability).mockResolvedValue([
      { id: 1, game_id: game1.id, player_id: 10, is_available: true, created_at: '', updated_at: '' },
    ])
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    await userEvent.click(screen.getAllByRole('button', { name: /duplicate/i })[0])
    await waitFor(() => {
      expect(createAvailability).toHaveBeenCalledWith(3, 10, true)
    })
  })

  it('Duplicate copies lineup slots to the new game', async () => {
    const newGame = { ...game1, id: 3, game_number: null }
    const newLineup = { id: 55, game_id: 3, name: 'Default', is_final: false, created_at: '', updated_at: '' }
    vi.mocked(createGame).mockResolvedValue(newGame)
    vi.mocked(getLineups).mockResolvedValue([{ id: 10, game_id: game1.id, name: 'Default', is_final: false, created_at: '', updated_at: '' }])
    vi.mocked(getLineup).mockResolvedValue({ id: 10, game_id: game1.id, name: 'Default', is_final: false, created_at: '', updated_at: '',
      slots: [{ id: 1, lineup_id: 10, player_id: 7, batting_order: 1, fielding_position: 'SS', created_at: '', updated_at: '' }],
    })
    vi.mocked(createLineup).mockResolvedValue(newLineup)
    render(<MemoryRouter><GamesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('Red Sox'))
    await userEvent.click(screen.getAllByRole('button', { name: /duplicate/i })[0])
    await waitFor(() => {
      expect(createLineup).toHaveBeenCalledWith({ game_id: 3 })
      expect(createSlot).toHaveBeenCalledWith(55, { player_id: 7, batting_order: 1, fielding_position: 'SS' })
    })
  })

  it('View button navigates to /games/:id', async () => {
    render(
      <MemoryRouter initialEntries={['/games']}>
        <Routes>
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:id" element={<div>Game Detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByText('Red Sox'))
    const viewButtons = screen.getAllByRole('button', { name: /view/i })
    await userEvent.click(viewButtons[0])
    expect(screen.getByText('Game Detail')).toBeInTheDocument()
  })
})
