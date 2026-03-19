import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayersPage from '../PlayersPage'
import type { Player } from '@/api/players'

vi.mock('@/api/players', () => ({
  getPlayers: vi.fn(),
  createPlayer: vi.fn(),
  updatePlayer: vi.fn(),
  deletePlayer: vi.fn(),
}))

import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '@/api/players'

const alice: Player = {
  id: 1,
  name: 'Alice',
  jersey_number: '7',
  capable_positions: ['SS', '2B'],
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const bob: Player = {
  id: 2,
  name: 'Bob',
  jersey_number: null,
  capable_positions: null,
  is_active: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getPlayers).mockResolvedValue([alice, bob])
})

describe('PlayersPage', () => {
  it('shows loading state on initial mount', () => {
    vi.mocked(getPlayers).mockReturnValue(new Promise(() => {}))
    render(<PlayersPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders player rows after data loads', async () => {
    render(<PlayersPage />)
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })

  it('"Add Player" button opens the dialog', async () => {
    render(<PlayersPage />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))
    expect(screen.getByRole('heading', { name: 'Add Player' })).toBeInTheDocument()
  })

  it('Edit button opens dialog pre-filled with the player', async () => {
    render(<PlayersPage />)
    await waitFor(() => screen.getByText('Alice'))
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    expect(screen.getByRole('heading', { name: 'Edit Player' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('Delete button calls deletePlayer and reloads', async () => {
    vi.mocked(deletePlayer).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<PlayersPage />)
    await waitFor(() => screen.getByText('Alice'))
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    await waitFor(() => {
      expect(deletePlayer).toHaveBeenCalledWith(alice.id)
    })
  })

  it('shows error message when getPlayers rejects', async () => {
    vi.mocked(getPlayers).mockRejectedValue(new Error('Network error'))
    render(<PlayersPage />)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('submit in add mode calls createPlayer', async () => {
    vi.mocked(createPlayer).mockResolvedValue({ ...alice, id: 3, name: 'Charlie' })
    render(<PlayersPage />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))
    await userEvent.type(screen.getByLabelText(/name/i), 'Charlie')
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))
    await waitFor(() => {
      expect(createPlayer).toHaveBeenCalledWith(expect.objectContaining({ name: 'Charlie' }))
      expect(updatePlayer).not.toHaveBeenCalled()
    })
  })

  it('submit in edit mode calls updatePlayer', async () => {
    vi.mocked(updatePlayer).mockResolvedValue({ ...alice, name: 'Alice Updated' })
    render(<PlayersPage />)
    await waitFor(() => screen.getByText('Alice'))
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(updatePlayer).toHaveBeenCalledWith(alice.id, expect.any(Object))
      expect(createPlayer).not.toHaveBeenCalled()
    })
  })

  it('getPlayers is refetched after successful submit', async () => {
    vi.mocked(createPlayer).mockResolvedValue({ ...alice, id: 3, name: 'Charlie' })
    render(<PlayersPage />)
    await waitFor(() => screen.getByText('Alice'))
    expect(getPlayers).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))
    await userEvent.type(screen.getByLabelText(/name/i), 'Charlie')
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))
    await waitFor(() => {
      expect(getPlayers).toHaveBeenCalledTimes(2)
    })
  })

  it('cancel confirm does not call deletePlayer', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<PlayersPage />)
    await waitFor(() => screen.getByText('Alice'))
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    expect(deletePlayer).not.toHaveBeenCalled()
  })
})
