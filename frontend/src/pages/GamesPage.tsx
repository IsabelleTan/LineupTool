import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import GameTable from '@/components/games/GameTable'
import GameDialog from '@/components/games/GameDialog'
import { useToast, Toast } from '@/lib/toast'
import {
  getGames,
  createGame,
  updateGame,
  deleteGame,
  type Game,
  type GameCreate,
} from '@/api/games'

function splitGames(games: Game[]): { upcoming: Game[]; past: Game[] } {
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = games
    .filter((g) => g.game_date >= today)
    .sort((a, b) => a.game_date.localeCompare(b.game_date))
  const past = games
    .filter((g) => g.game_date < today)
    .sort((a, b) => b.game_date.localeCompare(a.game_date))
  return { upcoming, past }
}

export default function GamesPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | undefined>()
  const { toastMessage, showToast } = useToast()

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
      showToast('Game saved')
    } else {
      await createGame(data)
      showToast('Game added')
    }
    await load()
  }

  async function handleDelete(game: Game) {
    if (!confirm(`Delete game vs ${game.opponent}?`)) return
    await deleteGame(game.id)
    await load()
  }

  const { upcoming, past } = splitGames(games)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Games</h1>
        <Button onClick={openAdd}>Add Game</Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">Upcoming Games</h2>
            {upcoming.length === 0
              ? <p className="text-muted-foreground text-sm">No upcoming games.</p>
              : <GameTable
                  games={upcoming}
                  onView={(g) => navigate(`/games/${g.id}`)}
                  onEdit={openEdit}
                  onDelete={(g) => void handleDelete(g)}
                />
            }
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">Past Games</h2>
            {past.length === 0
              ? <p className="text-muted-foreground text-sm">No past games.</p>
              : <GameTable
                  games={past}
                  onView={(g) => navigate(`/games/${g.id}`)}
                  onEdit={openEdit}
                  onDelete={(g) => void handleDelete(g)}
                />
            }
          </section>
        </>
      )}

      <GameDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        game={editingGame}
      />
      <Toast message={toastMessage} />
    </div>
  )
}
