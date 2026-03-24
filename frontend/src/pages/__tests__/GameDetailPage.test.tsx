import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GameDetailPage from '../GameDetailPage'
import type { Game } from '@/api/games'
import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'
import type { LineupRead, LineupReadWithSlots } from '@/api/lineups'

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

vi.mock('@/api/lineups', () => ({
  getLineups: vi.fn(),
  createLineup: vi.fn(),
  getLineup: vi.fn(),
  createSlot: vi.fn(),
  updateSlot: vi.fn(),
  deleteSlot: vi.fn(),
  reorderSlots: vi.fn(),
}))

import { getGame, updateGame } from '@/api/games'
import { getPlayers } from '@/api/players'
import { getAvailability, createAvailability, updateAvailability } from '@/api/availability'
import { getLineups, createLineup, getLineup, createSlot, updateSlot, deleteSlot, reorderSlots } from '@/api/lineups'

const game: Game = {
  id: 1,
  game_date: '2026-06-01',
  opponent: 'Red Sox',
  location: 'Fenway Park',
  is_home: false,
  game_number: null,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const player: Player = {
  id: 10,
  name: 'Alice',
  jersey_number: '7',
  license_number: null,
  capable_positions: ['SS'],
  role: 'Player',
  status: 'Active',
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

const lineupRead: LineupRead = {
  id: 100,
  game_id: 1,
  name: 'Default',
  is_final: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const lineupWithSlots: LineupReadWithSlots = { ...lineupRead, slots: [] }

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
  vi.mocked(getLineups).mockResolvedValue([lineupRead])
  vi.mocked(getLineup).mockResolvedValue(lineupWithSlots)
  vi.mocked(createLineup).mockResolvedValue(lineupRead)
  vi.mocked(createSlot).mockResolvedValue({
    id: 1,
    lineup_id: 100,
    player_id: 10,
    batting_order: 1,
    fielding_position: 'SS',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
  })
  vi.mocked(deleteSlot).mockResolvedValue(lineupWithSlots)
  vi.mocked(reorderSlots).mockResolvedValue(lineupWithSlots)
  vi.mocked(updateSlot).mockResolvedValue({
    id: 1,
    lineup_id: 100,
    player_id: 10,
    batting_order: 1,
    fielding_position: 'SS',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
  })
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
      expect(screen.getByRole('heading', { name: /vs Red Sox/i })).toBeInTheDocument()
      // Fenway Park appears in both the header and the print sheet
      expect(screen.getAllByText(/Fenway Park/i).length).toBeGreaterThan(0)
    })
  })

  it('renders player in availability panel after load', async () => {
    renderPage()
    await waitFor(() => {
      // Player with no record hasn't replied — shown as unavailable
      expect(screen.getByRole('button', { name: /mark available/i })).toBeInTheDocument()
    })
  })

  it('calls createAvailability when no prior record and toggle clicked', async () => {
    vi.mocked(getAvailability).mockResolvedValue([])
    renderPage()
    // Player with no record hasn't replied — button says "Mark Available"
    await waitFor(() => screen.getByRole('button', { name: /mark available/i }))
    await userEvent.click(screen.getByRole('button', { name: /mark available/i }))
    await waitFor(() => {
      expect(createAvailability).toHaveBeenCalledWith(1, player.id, true)
    })
  })

  it('calls updateAvailability when prior record exists and toggle clicked', async () => {
    vi.mocked(getAvailability).mockResolvedValue([availabilityRecord])
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /mark unavailable/i }))
    await userEvent.click(screen.getByRole('button', { name: /mark unavailable/i }))
    await waitFor(() => {
      expect(updateAvailability).toHaveBeenCalledWith(1, availabilityRecord.id, false)
    })
  })

  it('refetches getAvailability after toggle', async () => {
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /mark available/i }))
    expect(getAvailability).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: /mark available/i }))
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

  it('submitting dialog calls updateGame and updates game state without full reload', async () => {
    const updatedGame = { ...game, opponent: 'Yankees' }
    vi.mocked(updateGame).mockResolvedValue(updatedGame)
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    await userEvent.click(screen.getByRole('button', { name: /edit game/i }))
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(updateGame).toHaveBeenCalledWith(1, expect.any(Object))
      // targeted update: getGame is only called once (initial load), not again after edit
      expect(getGame).toHaveBeenCalledTimes(1)
    })
  })

  it('"Games" breadcrumb navigates back to /games', async () => {
    renderPage()
    await waitFor(() => screen.getByRole('heading', { name: /vs Red Sox/i }))
    await userEvent.click(screen.getByRole('button', { name: /^games$/i }))
    expect(screen.getByText('Games List')).toBeInTheDocument()
  })

  // Lineup-specific tests
  it('fetches lineups on load', async () => {
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    expect(getLineups).toHaveBeenCalledWith(1)
  })

  it('auto-creates lineup when getLineups returns empty array', async () => {
    vi.mocked(getLineups).mockResolvedValue([])
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    expect(createLineup).toHaveBeenCalledWith({ game_id: 1 })
  })

  it('does not create lineup when one already exists', async () => {
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    expect(createLineup).not.toHaveBeenCalled()
  })

  it('diamond position labels visible after load', async () => {
    renderPage()
    await waitFor(() => screen.getByText(/vs Red Sox/i))
    expect(screen.getAllByText('SS').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CF').length).toBeGreaterThan(0)
  })

  it('onAssign calls createSlot then getLineup', async () => {
    vi.mocked(getAvailability).mockResolvedValue([availabilityRecord])
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: 'Alice' }))
    // Alice is available and has SS position — click her card on diamond
    await userEvent.click(screen.getByRole('button', { name: 'Alice' }))
    await waitFor(() => {
      expect(createSlot).toHaveBeenCalledWith(
        100,
        expect.objectContaining({ player_id: 10, fielding_position: 'SS' }),
      )
      expect(getLineup).toHaveBeenCalledWith(100)
    })
  })

  it('onUnassign calls deleteSlot and uses the returned lineup', async () => {
    vi.mocked(getAvailability).mockResolvedValue([availabilityRecord])
    const slotSS = {
      id: 1,
      lineup_id: 100,
      player_id: 10,
      batting_order: 2,
      fielding_position: 'SS',
      created_at: '2024-01-01T00:00:00',
      updated_at: '2024-01-01T00:00:00',
    }
    vi.mocked(getLineup).mockResolvedValueOnce({ ...lineupWithSlots, slots: [slotSS] })
    vi.mocked(deleteSlot).mockResolvedValue({ ...lineupWithSlots, slots: [] })
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: 'Alice' }))
    const blueBtn = screen.getByRole('button', { name: 'Alice' })
    await userEvent.click(blueBtn)
    await waitFor(() => {
      expect(deleteSlot).toHaveBeenCalledWith(100, 1)
    })
  })

  it('availablePlayers excludes players with explicit is_available: false', async () => {
    const unavailRecord: GameAvailability = { ...availabilityRecord, is_available: false }
    vi.mocked(getAvailability).mockResolvedValue([unavailRecord])
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /mark available/i }))
    // Alice is explicitly unavailable — should not appear on diamond
    expect(screen.queryByRole('button', { name: 'Alice' })).not.toBeInTheDocument()
  })

  it('Print button calls window.print with correct document title', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /print/i }))
    await userEvent.click(screen.getByRole('button', { name: /print/i }))
    expect(printSpy).toHaveBeenCalled()
    expect(document.title).toBe('Line Up vs Red Sox 01-06-2026')
    printSpy.mockRestore()
  })

  it('busy disables diamond interaction during mutation', async () => {
    vi.mocked(getAvailability).mockResolvedValue([availabilityRecord])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolveSlot!: (v: any) => void
    vi.mocked(createSlot).mockReturnValue(new Promise((r) => { resolveSlot = r }))
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: 'Alice' }))
    const card = screen.getByRole('button', { name: 'Alice' })
    await userEvent.click(card)
    // While createSlot is pending, the button should be disabled
    expect(card).toBeDisabled()
    // resolve to clean up
    resolveSlot({
      id: 1, lineup_id: 100, player_id: 10, batting_order: 1,
      fielding_position: 'SS', created_at: '', updated_at: '',
    })
  })
})
