import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import GameDialog from '@/components/games/GameDialog'
import AvailabilityTable from '@/components/games/AvailabilityTable'
import { getGame, updateGame, type Game, type GameCreate } from '@/api/games'
import { getPlayers, type Player } from '@/api/players'
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  type GameAvailability,
} from '@/api/availability'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const gameId = Number(id)

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [availability, setAvailability] = useState<GameAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [gameData, playersData, availabilityData] = await Promise.all([
        getGame(gameId),
        getPlayers(),
        getAvailability(gameId),
      ])
      setGame(gameData)
      setPlayers(playersData.filter((p) => p.is_active))
      setAvailability(availabilityData)
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
    if (availabilityId === null) {
      await createAvailability(gameId, playerId, isAvailable)
    } else {
      await updateAvailability(gameId, availabilityId, isAvailable)
    }
    await load()
  }

  async function handleEditSubmit(data: GameCreate) {
    await updateGame(gameId, data)
    await load()
  }

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
          )}{' '}
          · {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
        </p>
        {game.location && <p className="text-muted-foreground">{game.location}</p>}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Player Availability</h2>
        <AvailabilityTable
          players={players}
          availability={availability}
          onToggle={(playerId, availabilityId, isAvailable) =>
            void handleToggle(playerId, availabilityId, isAvailable)
          }
        />
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
