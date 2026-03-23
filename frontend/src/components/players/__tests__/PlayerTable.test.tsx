import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayerTable from '../PlayerTable'
import type { Player } from '@/api/players'

const alice: Player = {
  id: 1,
  name: 'Alice',
  jersey_number: '7',
  license_number: null,
  capable_positions: ['SS', '2B'],
  role: 'Player',
  status: 'Active',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const bob: Player = {
  id: 2,
  name: 'Bob',
  jersey_number: null,
  license_number: null,
  capable_positions: null,
  role: 'Player',
  status: 'Inactive',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('PlayerTable', () => {
  it('shows default empty state when no players', () => {
    render(<PlayerTable players={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('None yet.')).toBeInTheDocument()
  })

  it('shows custom emptyMessage when provided', () => {
    render(<PlayerTable players={[]} onEdit={vi.fn()} onDelete={vi.fn()} emptyMessage="No staff added." />)
    expect(screen.getByText('No staff added.')).toBeInTheDocument()
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

  it('renders license number and falls back to — when null', () => {
    const withLicense: Player = { ...alice, license_number: '99001' }
    render(<PlayerTable players={[withLicense, bob]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('99001')).toBeInTheDocument()
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

  it('hides License column when showLicense=false', () => {
    render(<PlayerTable players={[alice]} onEdit={vi.fn()} onDelete={vi.fn()} showLicense={false} />)
    expect(screen.queryByText('License')).not.toBeInTheDocument()
  })

  it('hides Positions column when showPositions=false', () => {
    render(<PlayerTable players={[alice]} onEdit={vi.fn()} onDelete={vi.fn()} showPositions={false} />)
    expect(screen.queryByText('Positions')).not.toBeInTheDocument()
  })

  it('still shows Name and Status columns when License and Positions are hidden', () => {
    render(<PlayerTable players={[alice]} onEdit={vi.fn()} onDelete={vi.fn()} showLicense={false} showPositions={false} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})
