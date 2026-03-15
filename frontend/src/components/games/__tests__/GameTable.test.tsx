import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameTable from '../GameTable'
import type { Game } from '@/api/games'

const game1: Game = {
  id: 1,
  game_date: '2026-06-01',
  opponent: 'Red Sox',
  location: 'Fenway Park',
  is_home: false,
  status: 'scheduled',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const game2: Game = {
  id: 2,
  game_date: '2026-07-04',
  opponent: 'Yankees',
  location: null,
  is_home: true,
  status: 'completed',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('GameTable', () => {
  it('shows empty state message when no games', () => {
    render(<GameTable games={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/no games yet/i)).toBeInTheDocument()
  })

  it('renders a row for each game', () => {
    render(<GameTable games={[game1, game2]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Red Sox')).toBeInTheDocument()
    expect(screen.getByText('Yankees')).toBeInTheDocument()
  })

  it('shows — when location is null', () => {
    render(<GameTable games={[game2]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders correct status badge text for all statuses', () => {
    const cancelled: Game = { ...game1, id: 3, status: 'cancelled' }
    render(<GameTable games={[game1, game2, cancelled]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('renders Home badge for home games and Away for away games', () => {
    render(<GameTable games={[game1, game2]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Away')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('calls onEdit with the correct game when Edit is clicked', async () => {
    const onEdit = vi.fn()
    render(<GameTable games={[game1]} onEdit={onEdit} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(game1)
  })

  it('calls onDelete with the correct game when Delete is clicked', async () => {
    const onDelete = vi.fn()
    render(<GameTable games={[game1]} onEdit={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith(game1)
  })
})
