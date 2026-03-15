import { useEffect, useState } from 'react'
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

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Games</h1>
        <Button onClick={openAdd}>Add Game</Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && (
        <GameTable
          games={games}
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
