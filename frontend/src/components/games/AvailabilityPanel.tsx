import { Loader2 } from 'lucide-react'
import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'
import { isPlayerAvailable } from '@/lib/utils'

interface Props {
  players: Player[]
  availability: GameAvailability[]
  onToggle: (playerId: number, availabilityId: number | null, isAvailable: boolean) => void
  busy?: boolean
  busyPlayerId?: number | null
}

function PlayerHint({ player }: { player: Player }) {
  if (player.jersey_number == null) return null
  return (
    <span className="text-muted-foreground text-xs ml-1">
      #{player.jersey_number}
    </span>
  )
}

interface PlayerRowProps {
  player: Player
  isAvailable: boolean
  record: GameAvailability | undefined
  busy: boolean
  busyPlayerId?: number | null
  onToggle: (playerId: number, availabilityId: number | null, isAvailable: boolean) => void
}

function PlayerRow({ player, isAvailable, record, busy, busyPlayerId, onToggle }: PlayerRowProps) {
  const isThisRowBusy = busyPlayerId === player.id
  return (
    <div className="flex items-center gap-2 py-1">
      <button
        aria-label={isAvailable ? 'Mark Unavailable' : 'Mark Available'}
        disabled={busy}
        onClick={() => onToggle(player.id, record?.id ?? null, !isAvailable)}
        className={`w-6 h-6 rounded-md text-sm flex items-center justify-center shrink-0
          transition-colors disabled:opacity-30 ${
          isAvailable
            ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
            : 'text-green-500 hover:text-green-700 hover:bg-green-50'
        }`}
      >
        {isThisRowBusy
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : (isAvailable ? '−' : '+')}
      </button>
      <span className="text-sm">
        {player.name}
        <PlayerHint player={player} />
      </span>
    </div>
  )
}

function Section({
  title,
  players,
  availability,
  busy,
  busyPlayerId,
  onToggle,
  isAvailableSection,
}: {
  title: string
  players: Player[]
  availability: GameAvailability[]
  busy: boolean
  busyPlayerId?: number | null
  onToggle: Props['onToggle']
  isAvailableSection: boolean
}) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-1">{title} ({players.length})</h3>
      {players.length === 0 ? (
        <p className="text-muted-foreground text-xs">None</p>
      ) : (
        <div>
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              isAvailable={isAvailableSection}
              record={availability.find((a) => a.player_id === p.id)}
              busy={busy}
              busyPlayerId={busyPlayerId}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AvailabilityPanel({ players, availability, onToggle, busy = false, busyPlayerId }: Props) {
  if (players.length === 0) {
    return <p className="text-muted-foreground text-sm">No players found.</p>
  }

  const availablePlayers = players.filter(
    (p) => isPlayerAvailable(p, availability) && p.role === 'Player' && p.status !== 'Injured',
  )
  const availableStaff = players.filter(
    (p) => isPlayerAvailable(p, availability) && (p.role === 'Staff' || p.status === 'Injured'),
  )
  const unavailable = players.filter((p) => !isPlayerAvailable(p, availability))

  return (
    <div className="space-y-4">
      <Section
        title="Available Players"
        players={availablePlayers}
        availability={availability}
        busy={busy}
        busyPlayerId={busyPlayerId}
        onToggle={onToggle}
        isAvailableSection={true}
      />
      <Section
        title="Available Staff"
        players={availableStaff}
        availability={availability}
        busy={busy}
        busyPlayerId={busyPlayerId}
        onToggle={onToggle}
        isAvailableSection={true}
      />
      <Section
        title="Unavailable"
        players={unavailable}
        availability={availability}
        busy={busy}
        busyPlayerId={busyPlayerId}
        onToggle={onToggle}
        isAvailableSection={false}
      />
    </div>
  )
}
