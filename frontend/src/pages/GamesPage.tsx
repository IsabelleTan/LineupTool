import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import GameTable from '@/components/games/GameTable'
import GameDialog from '@/components/games/GameDialog'
import {
  getGames,
  createGame,
  updateGame,
  deleteGame,
  type Game,
  type GameCreate,
} from '@/api/games'

type Filter = 'upcoming' | 'past'

function filterAndSort(games: Game[], filter: Filter): Game[] {
  const today = new Date().toISOString().slice(0, 10)
  const filtered = games.filter((g) => {
    const isPast = g.status !== 'scheduled' || g.game_date < today
    return filter === 'past' ? isPast : !isPast
  })
  filtered.sort((a, b) => a.game_date.localeCompare(b.game_date))
  return filtered
}

export default function GamesPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('upcoming')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | undefined>()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setGames(await getGames())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openAdd() {
    setEditingGame(undefined)
    setDialogOpen(true)
  }

  function openEdit(game: Game) {
    setEditingGame(game)
    setDialogOpen(true)
  }

  async function handleSubmit(data: GameCreate) {
    if (editingGame) {
      await updateGame(editingGame.id, data)
    } else {
      await createGame(data)
    }
    await load()
  }

  async function handleDelete(game: Game) {
    if (!confirm(`Delete game vs ${game.opponent}?`)) return
    await deleteGame(game.id)
    await load()
  }

  const visibleGames = filterAndSort(games, filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Games</h1>
        <Button onClick={openAdd}>Add Game</Button>
      </div>

      <div className="flex gap-1 border rounded-md w-fit p-1">
        {(['upcoming', 'past'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && (
        <GameTable
          games={visibleGames}
          onView={(g) => navigate(`/games/${g.id}`)}
          onEdit={openEdit}
          onDelete={(g) => void handleDelete(g)}
        />
      )}

      <GameDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        game={editingGame}
      />
    </div>
  )
}
