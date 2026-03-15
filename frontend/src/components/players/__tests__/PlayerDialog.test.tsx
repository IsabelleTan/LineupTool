import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayerDialog from '../PlayerDialog'
import type { Player } from '@/api/players'

const alice: Player = {
  id: 1,
  name: 'Alice',
  jersey_number: '7',
  capable_positions: ['SS', '2B'],
  preferred_position: 'SS',
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('PlayerDialog — add mode', () => {
  it('renders "Add Player" title when no player prop', () => {
    render(<PlayerDialog open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Add Player' })).toBeInTheDocument()
  })

  it('submit button is disabled when name is empty', () => {
    render(<PlayerDialog open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add player/i })).toBeDisabled()
  })

  it('calls onSubmit and then onClose when form is submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<PlayerDialog open onClose={onClose} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Charlie')
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Charlie' }),
      )
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('splits capable_positions on comma', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PlayerDialog open onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Dana')
    await userEvent.type(screen.getByLabelText(/capable positions/i), 'P, 1B, CF')
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ capable_positions: ['P', '1B', 'CF'] }),
      )
    })
  })

  it('shows error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
    render(<PlayerDialog open onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Eve')
    await userEvent.click(screen.getByRole('button', { name: /add player/i }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })
})

describe('PlayerDialog — edit mode', () => {
  it('renders "Edit Player" title when player prop is provided', () => {
    render(<PlayerDialog open onClose={vi.fn()} onSubmit={vi.fn()} player={alice} />)
    expect(screen.getByRole('heading', { name: 'Edit Player' })).toBeInTheDocument()
  })

  it('pre-fills the form with the player data', () => {
    render(<PlayerDialog open onClose={vi.fn()} onSubmit={vi.fn()} player={alice} />)
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('SS, 2B')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<PlayerDialog open onClose={onClose} onSubmit={vi.fn()} player={alice} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
