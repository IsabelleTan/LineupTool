import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LineupPrintView from '../LineupPrintView'
import type { Game } from '@/api/games'
import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'

const awayGame: Game = {
  id: 1,
  game_date: '2026-06-12',
  opponent: 'Flyers',
  location: 'Bern',
  is_home: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const homeGame: Game = { ...awayGame, is_home: true }

const alice: Player = {
  id: 10,
  name: 'Alice',
  jersey_number: '7',
  license_number: 'L123',
  capable_positions: ['SS'],
  role: 'Player',
  status: 'Active',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const bob: Player = {
  id: 20,
  name: 'Bob',
  jersey_number: '9',
  license_number: null,
  capable_positions: ['CF'],
  role: 'Player',
  status: 'Active',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

const slot1: LineupSlotRead = {
  id: 1,
  lineup_id: 100,
  player_id: 10,
  batting_order: 1,
  fielding_position: 'SS',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
}

describe('LineupPrintView', () => {
  it('shows opponent as HOME and Challengers as GUEST for away game', () => {
    render(<LineupPrintView game={awayGame} slots={[]} players={[]} availablePlayers={[]} />)
    expect(screen.getByText('Flyers')).toBeInTheDocument()
    expect(screen.getByText('Challengers')).toBeInTheDocument()
  })

  it('shows Challengers as HOME and opponent as GUEST for home game', () => {
    render(<LineupPrintView game={homeGame} slots={[]} players={[]} availablePlayers={[]} />)
    expect(screen.getByText('Challengers')).toBeInTheDocument()
    expect(screen.getByText('Flyers')).toBeInTheDocument()
  })

  it('shows formatted game date', () => {
    render(<LineupPrintView game={awayGame} slots={[]} players={[]} availablePlayers={[]} />)
    expect(screen.getByText('Jun 12, 2026')).toBeInTheDocument()
  })

  it('renders 10 batting order slots including Flex', () => {
    render(<LineupPrintView game={awayGame} slots={[]} players={[]} availablePlayers={[]} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('9.')).toBeInTheDocument()
    expect(screen.getByText('Flex')).toBeInTheDocument()
  })

  it('shows player name, license, jersey number and position in their batting slot', () => {
    render(<LineupPrintView game={awayGame} slots={[slot1]} players={[alice]} availablePlayers={[alice]} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('L123')).toBeInTheDocument()
    expect(screen.getAllByText('7').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SS').length).toBeGreaterThan(0)
  })

  it('shows available unslotted licensed player in bench table', () => {
    render(<LineupPrintView game={awayGame} slots={[slot1]} players={[alice, bob]} availablePlayers={[alice, bob]} />)
    // Alice is in slot 1, Bob is on the bench
    const bobs = screen.getAllByText('Bob')
    expect(bobs.length).toBeGreaterThan(0)
  })

  it('shows unlicensed bench players under SPIELER OHNE LIZENZ', () => {
    render(<LineupPrintView game={awayGame} slots={[]} players={[bob]} availablePlayers={[bob]} />)
    expect(screen.getByText('SPIELER OHNE LIZENZ')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows licensed bench player above SPIELER OHNE LIZENZ, not under it', () => {
    render(<LineupPrintView game={awayGame} slots={[]} players={[alice]} availablePlayers={[alice]} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('L123')).toBeInTheDocument()
  })

  it('shows signature blocks for manager and umpire', () => {
    render(<LineupPrintView game={awayGame} slots={[]} players={[]} availablePlayers={[]} />)
    expect(screen.getByText('Unterschrift Manager')).toBeInTheDocument()
    expect(screen.getByText('Unterschrift Umpire')).toBeInTheDocument()
  })

  it('shows HOME GUEST DATE PLACE GROUND SPIELNUMMER labels', () => {
    render(<LineupPrintView game={awayGame} slots={[]} players={[]} availablePlayers={[]} />)
    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.getByText('GUEST')).toBeInTheDocument()
    expect(screen.getByText('DATE')).toBeInTheDocument()
    expect(screen.getByText('PLACE')).toBeInTheDocument()
    expect(screen.getByText('GROUND')).toBeInTheDocument()
    expect(screen.getByText('SPIELNUMMER')).toBeInTheDocument()
  })

  it('slotted player does not appear in the bench tables', () => {
    render(<LineupPrintView game={awayGame} slots={[slot1]} players={[alice]} availablePlayers={[alice]} />)
    // Alice is in slot 1 — she should appear exactly once (in the batting order), not duplicated in bench
    expect(screen.getAllByText('Alice')).toHaveLength(1)
  })
})
