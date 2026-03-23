import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import PlayerTable from '@/components/players/PlayerTable'
import PlayerDialog from '@/components/players/PlayerDialog'
import { useToast } from '@/lib/useToast'
import { Toast } from '@/lib/toast'
import {
  getPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  type Player,
  type PlayerCreate,
} from '@/api/players'

const STATUS_ORDER: Record<string, number> = { Active: 0, Injured: 1, Inactive: 2 }

function sortRoster(list: Player[]) {
  return [...list].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
    if (s !== 0) return s
    return a.name.localeCompare(b.name)
  })
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>()
  const { toastMessage, showToast } = useToast()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setPlayers(await getPlayers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openAdd() {
    setEditingPlayer(undefined)
    setDialogOpen(true)
  }

  function openEdit(player: Player) {
    setEditingPlayer(player)
    setDialogOpen(true)
  }

  async function handleSubmit(data: PlayerCreate) {
    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, data)
      showToast('Player saved')
    } else {
      await createPlayer(data)
      showToast('Player added')
    }
    await load()
  }

  async function handleDelete(player: Player) {
    if (!confirm(`Delete ${player.name}?`)) return
    await deletePlayer(player.id)
    await load()
  }

  const playersList = sortRoster(players.filter((p) => p.role === 'Player'))
  const staffList = sortRoster(players.filter((p) => p.role === 'Staff'))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Roster</h1>
        <Button onClick={openAdd}>Add Player</Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && (
        <>
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Players</h2>
            <PlayerTable
              players={playersList}
              onEdit={openEdit}
              onDelete={(p) => void handleDelete(p)}
              onRowClick={openEdit}
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Staff</h2>
            <PlayerTable
              players={staffList}
              onEdit={openEdit}
              onDelete={(p) => void handleDelete(p)}
              onRowClick={openEdit}
              showNumber={false}
              showLicense={false}
              showPositions={false}
            />
          </div>
        </>
      )}

      <PlayerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        player={editingPlayer}
      />
      <Toast message={toastMessage} />
    </div>
  )
}
