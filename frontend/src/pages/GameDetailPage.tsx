import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import GameDialog from '@/components/games/GameDialog'
import AvailabilityPanel from '@/components/games/AvailabilityPanel'
import DiamondView from '@/components/games/DiamondView'
import LineupOrder from '@/components/games/LineupOrder'
import { getGame, updateGame, type Game, type GameCreate } from '@/api/games'
import { getPlayers, type Player } from '@/api/players'
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  type GameAvailability,
} from '@/api/availability'
import { formatDate, isPlayerAvailable } from '@/lib/utils'
import {
  getLineups,
  createLineup,
  getLineup,
  createSlot,
  updateSlot,
  deleteSlot,
  reorderSlots,
  type LineupReadWithSlots,
} from '@/api/lineups'

// Sequential compaction: process front-to-back so each slot only moves into
// a position that was just vacated — avoids unique-constraint conflicts.
async function compactBattingOrders(
  lineupId: number,
  slots: { id: number; batting_order: number }[],
) {
  const sorted = [...slots].sort((a, b) => a.batting_order - b.batting_order)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].batting_order !== i + 1) {
      await updateSlot(lineupId, sorted[i].id, { batting_order: i + 1 })
    }
  }
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const gameId = Number(id)

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [availability, setAvailability] = useState<GameAvailability[]>([])
  const [lineup, setLineup] = useState<LineupReadWithSlots | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [gameData, playersData, availabilityData, lineups] = await Promise.all([
        getGame(gameId),
        getPlayers(),
        getAvailability(gameId),
        getLineups(gameId),
      ])
      setGame(gameData)
      setPlayers(playersData.filter((p) => p.is_active))
      setAvailability(availabilityData)

      let lineupId: number
      if (lineups.length === 0) {
        const created = await createLineup({ game_id: gameId })
        lineupId = created.id
      } else {
        lineupId = lineups[0].id
      }
      setLineup(await getLineup(lineupId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  async function handleToggle(
    playerId: number,
    availabilityId: number | null,
    isAvailable: boolean,
  ) {
    setBusy(true)
    setMutationError(null)
    try {
      // Marking unavailable: remove any existing lineup slot for this player first
      if (!isAvailable && lineup) {
        const slot = lineup.slots.find((s) => s.player_id === playerId)
        if (slot) {
          await deleteSlot(lineup.id, slot.id)
          const afterDelete = await getLineup(lineup.id)
          await compactBattingOrders(lineup.id, afterDelete.slots)
          setLineup(await getLineup(lineup.id))
        }
      }
      if (availabilityId === null) {
        await createAvailability(gameId, playerId, isAvailable)
      } else {
        await updateAvailability(gameId, availabilityId, isAvailable)
      }
      setAvailability(await getAvailability(gameId))
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to update availability')
    } finally {
      setBusy(false)
    }
  }

  async function handleAssign(playerId: number, position: string) {
    if (!lineup) return
    setBusy(true)
    setMutationError(null)
    try {
      // Remove any player already occupying this position, then compact
      const existing = lineup.slots.find((s) => s.fielding_position === position)
      let slotCount = lineup.slots.length
      if (existing) {
        await deleteSlot(lineup.id, existing.id)
        const afterDelete = await getLineup(lineup.id)
        await compactBattingOrders(lineup.id, afterDelete.slots)
        slotCount = afterDelete.slots.length
      }
      await createSlot(lineup.id, {
        player_id: playerId,
        batting_order: slotCount + 1,
        fielding_position: position,
      })
      setLineup(await getLineup(lineup.id))
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to update lineup')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnassign(slotId: number) {
    if (!lineup) return
    setBusy(true)
    setMutationError(null)
    try {
      await deleteSlot(lineup.id, slotId)
      const afterDelete = await getLineup(lineup.id)
      await compactBattingOrders(lineup.id, afterDelete.slots)
      setLineup(await getLineup(lineup.id))
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to update lineup')
    } finally {
      setBusy(false)
    }
  }

  async function handleReorder(orderedSlotIds: number[]) {
    if (!lineup) return
    setBusy(true)
    setMutationError(null)
    try {
      setLineup(await reorderSlots(lineup.id, orderedSlotIds))
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to reorder')
    } finally {
      setBusy(false)
    }
  }

  async function handleEditSubmit(data: GameCreate) {
    setMutationError(null)
    try {
      setGame(await updateGame(gameId, data))
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to save game')
    }
  }

  const availablePlayers = players.filter((p) => isPlayerAvailable(p, availability))

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  if (!game) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/games')}>
          ← Games
        </Button>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          Edit Game
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">vs {game.opponent}</h1>
        <p className="text-muted-foreground">
          {formatDate(game.game_date)} ·{' '}
          {game.is_home ? (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Home</Badge>
          ) : (
            <Badge variant="secondary">Away</Badge>
          )}
        </p>
        {game.location && <p className="text-muted-foreground">{game.location}</p>}
      </div>

      {mutationError && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <span>{mutationError}</span>
          <button
            onClick={() => setMutationError(null)}
            className="text-destructive hover:opacity-70 font-medium"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4 items-start">
        <div>
          <h2 className="text-lg font-medium mb-2">Availability</h2>
          <AvailabilityPanel
            players={players}
            availability={availability}
            busy={busy}
            onToggle={(playerId, availabilityId, isAvailable) =>
              void handleToggle(playerId, availabilityId, isAvailable)
            }
          />
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Lineup</h2>
          <DiamondView
            availablePlayers={availablePlayers}
            slots={lineup?.slots ?? []}
            onAssign={(playerId, position) => void handleAssign(playerId, position)}
            onUnassign={(slotId) => void handleUnassign(slotId)}
            busy={busy}
          />
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Batting Order</h2>
          <LineupOrder
            slots={lineup?.slots ?? []}
            players={players}
            availablePlayers={availablePlayers}
            onReorder={(ids) => void handleReorder(ids)}
          />
        </div>
      </div>

      <GameDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleEditSubmit}
        game={game}
      />
    </div>
  )
}
