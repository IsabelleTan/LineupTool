import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayerTable from '../PlayerTable'
import type { Player } from '@/api/players'

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

describe('PlayerTable', () => {
  it('shows empty state message when no players', () => {
    render(<PlayerTable players={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/no players yet/i)).toBeInTheDocument()
  })

  it('renders a row for each player', () => {
    render(<PlayerTable players={[alice, bob]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows Active badge for active player and Inactive for inactive', () => {
    render(<PlayerTable players={[alice, bob]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('renders jersey number and falls back to — when null', () => {
    render(<PlayerTable players={[alice, bob]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('7')).toBeInTheDocument()
    // Bob has null jersey — should show em dash
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('calls onEdit with the correct player when Edit is clicked', async () => {
    const onEdit = vi.fn()
    render(<PlayerTable players={[alice]} onEdit={onEdit} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(alice)
  })

  it('calls onDelete with the correct player when Delete is clicked', async () => {
    const onDelete = vi.fn()
    render(<PlayerTable players={[alice]} onEdit={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith(alice)
  })
})
