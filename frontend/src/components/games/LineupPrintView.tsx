import type { Game } from '@/api/games'
import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'
import { formatDate } from '@/lib/utils'

interface Props {
  game: Game
  slots: LineupSlotRead[]
  players: Player[]
  onClose: () => void
}

export default function LineupPrintView({ game, slots, players, onClose }: Props) {
  const ordered = [...slots].sort((a, b) => a.batting_order - b.batting_order)

  function playerName(playerId: number) {
    return players.find((p) => p.id === playerId)?.name ?? '—'
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto print:static print:overflow-visible">
      <div className="max-w-2xl mx-auto p-8">
        {/* Close button — hidden when printing */}
        <div className="flex justify-end mb-6 print:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">vs {game.opponent}</h1>
          <p className="text-gray-600 mt-1">
            {formatDate(game.game_date)} &middot; {game.is_home ? 'Home' : 'Away'}
            {game.location ? ` \u00b7 ${game.location}` : ''}
          </p>
        </div>

        {/* Lineup table */}
        {ordered.length === 0 ? (
          <p className="text-gray-500">No players assigned yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 pr-4 w-8">#</th>
                <th className="text-left py-2 pr-4">Player</th>
                <th className="text-left py-2">Position</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((slot) => (
                <tr key={slot.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-500">{slot.batting_order}</td>
                  <td className="py-2 pr-4 font-medium">{playerName(slot.player_id)}</td>
                  <td className="py-2 text-gray-600">{slot.fielding_position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
