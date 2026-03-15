import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameDialog from '../GameDialog'
import type { Game } from '@/api/games'

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

describe('GameDialog — add mode', () => {
  it('renders "Add Game" title when no game prop', () => {
    render(<GameDialog open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Add Game' })).toBeInTheDocument()
  })

  it('submit button is disabled when date or opponent is empty', () => {
    render(<GameDialog open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add game/i })).toBeDisabled()
  })

  it('calls onSubmit and then onClose on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<GameDialog open onClose={onClose} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ opponent: 'Cubs' }))
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
    render(<GameDialog open onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('submit button shows "Saving…" and is disabled during submission', async () => {
    let resolve!: () => void
    const onSubmit = vi.fn().mockReturnValue(new Promise<void>((r) => { resolve = r }))
    render(<GameDialog open onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    resolve()
  })
})

describe('GameDialog — null coercion', () => {
  it('empty location becomes null on submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<GameDialog open onClose={vi.fn()} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ location: null }))
    })
  })

  it('is_home defaults to true and can be unchecked', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<GameDialog open onClose={vi.fn()} onSubmit={onSubmit} />)
    const checkbox = screen.getByRole('checkbox', { name: /home game/i })
    expect(checkbox).toBeChecked()
    await userEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
    await userEvent.type(screen.getByLabelText(/opponent/i), 'Cubs')
    await userEvent.type(screen.getByLabelText(/date/i), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: /add game/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ is_home: false }))
    })
  })
})

describe('GameDialog — edit mode', () => {
  it('renders "Edit Game" title when game prop is provided', () => {
    render(<GameDialog open onClose={vi.fn()} onSubmit={vi.fn()} game={game} />)
    expect(screen.getByRole('heading', { name: 'Edit Game' })).toBeInTheDocument()
  })

  it('pre-fills the form with the game data', () => {
    render(<GameDialog open onClose={vi.fn()} onSubmit={vi.fn()} game={game} />)
    expect(screen.getByDisplayValue('Red Sox')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-06-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fenway Park')).toBeInTheDocument()
  })

  it('submit button shows "Save Changes" in edit mode', () => {
    render(<GameDialog open onClose={vi.fn()} onSubmit={vi.fn()} game={game} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
