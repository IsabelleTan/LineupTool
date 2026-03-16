import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'
import { isPlayerAvailable } from '@/lib/utils'

interface Props {
  players: Player[]
  availability: GameAvailability[]
  onToggle: (playerId: number, availabilityId: number | null, isAvailable: boolean) => void
  busy?: boolean
}

function PlayerHint({ player }: { player: Player }) {
  const hint = player.jersey_number != null
    ? `#${player.jersey_number}`
    : player.preferred_position ?? null
  return (
    <span className="text-muted-foreground text-xs ml-1">
      {hint}
    </span>
  )
}

interface PlayerRowProps {
  player: Player
  isAvailable: boolean
  record: GameAvailability | undefined
  busy: boolean
  onToggle: (playerId: number, availabilityId: number | null, isAvailable: boolean) => void
}

function PlayerRow({ player, isAvailable, record, busy, onToggle }: PlayerRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">
        {player.name}
        <PlayerHint player={player} />
      </span>
      <button
        aria-label={isAvailable ? 'Mark Unavailable' : 'Mark Available'}
        disabled={busy}
        onClick={() => onToggle(player.id, record?.id ?? null, !isAvailable)}
        className={`w-6 h-6 rounded-full text-white text-base font-bold leading-none flex items-center justify-center shrink-0 disabled:opacity-50 ${
          isAvailable
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {isAvailable ? '−' : '+'}
      </button>
    </div>
  )
}

export default function AvailabilityPanel({ players, availability, onToggle, busy = false }: Props) {
  if (players.length === 0) {
    return <p className="text-muted-foreground text-sm">No players found.</p>
  }

  const available = players.filter((p) => isPlayerAvailable(p, availability))
  const unavailable = players.filter((p) => !isPlayerAvailable(p, availability))

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Available</h3>
        {available.length === 0 ? (
          <p className="text-muted-foreground text-xs">None</p>
        ) : (
          <div>{available.map((p) => <PlayerRow key={p.id} player={p} isAvailable={true} record={availability.find(a => a.player_id === p.id)} busy={busy} onToggle={onToggle} />)}</div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium mb-1">Unavailable</h3>
        {unavailable.length === 0 ? (
          <p className="text-muted-foreground text-xs">None</p>
        ) : (
          <div>{unavailable.map((p) => <PlayerRow key={p.id} player={p} isAvailable={false} record={availability.find(a => a.player_id === p.id)} busy={busy} onToggle={onToggle} />)}</div>
        )}
      </div>
    </div>
  )
}
