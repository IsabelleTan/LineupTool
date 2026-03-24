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
  game_number: 1,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const game2: Game = {
  id: 2,
  game_date: '2026-07-04',
  opponent: 'Yankees',
  location: null,
  is_home: true,
  game_number: null,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('GameTable', () => {
  it('shows empty state message when no games', () => {
    render(<GameTable games={[]} onView={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/no games yet/i)).toBeInTheDocument()
  })

  it('renders a row for each game', () => {
    render(<GameTable games={[game1, game2]} onView={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Red Sox')).toBeInTheDocument()
    expect(screen.getByText('Yankees')).toBeInTheDocument()
  })

  it('shows game_number when set and — when null', () => {
    render(<GameTable games={[game1, game2]} onView={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders Home badge for home games and Away for away games', () => {
    render(<GameTable games={[game1, game2]} onView={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Away')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('calls onView with the correct game when View is clicked', async () => {
    const onView = vi.fn()
    render(<GameTable games={[game1]} onView={onView} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /view/i }))
    expect(onView).toHaveBeenCalledWith(game1)
  })

  it('calls onEdit with the correct game when Edit is clicked', async () => {
    const onEdit = vi.fn()
    render(<GameTable games={[game1]} onView={vi.fn()} onEdit={onEdit} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(game1)
  })

  it('calls onDuplicate with the correct game when Duplicate is clicked', async () => {
    const onDuplicate = vi.fn()
    render(<GameTable games={[game1]} onView={vi.fn()} onEdit={vi.fn()} onDuplicate={onDuplicate} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /duplicate/i }))
    expect(onDuplicate).toHaveBeenCalledWith(game1)
  })

  it('calls onDelete with the correct game when Delete is clicked', async () => {
    const onDelete = vi.fn()
    render(<GameTable games={[game1]} onView={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith(game1)
  })

  it('calls onView when a row is clicked', async () => {
    const onView = vi.fn()
    render(<GameTable games={[game1]} onView={onView} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByText('Red Sox'))
    expect(onView).toHaveBeenCalledWith(game1)
  })

  it('does not call onView when Edit is clicked', async () => {
    const onView = vi.fn()
    render(<GameTable games={[game1]} onView={onView} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onView).not.toHaveBeenCalled()
  })

  it('does not call onView when Duplicate is clicked', async () => {
    const onView = vi.fn()
    render(<GameTable games={[game1]} onView={onView} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /duplicate/i }))
    expect(onView).not.toHaveBeenCalled()
  })

  it('does not call onView when Delete is clicked', async () => {
    const onView = vi.fn()
    render(<GameTable games={[game1]} onView={onView} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onView).not.toHaveBeenCalled()
  })
})
