import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'

// eslint-disable-next-line react-refresh/only-export-components
export function abbreviateName(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts[0][0]}. ${last}`
}

const POSITIONS = [
  { key: 'CF', left: '50%', top: '5%'  },
  { key: 'LF', left: '15%', top: '28%' },
  { key: 'RF', left: '85%', top: '28%' },
  { key: 'SS', left: '35%', top: '50%' },
  { key: '2B', left: '62%', top: '46%' },
  { key: '3B', left: '22%', top: '60%' },
  { key: '1B', left: '75%', top: '60%' },
  { key: 'P',  left: '50%', top: '57%' },
  { key: 'C',  left: '50%', top: '88%' },
]

interface Props {
  availablePlayers: Player[]
  slots: LineupSlotRead[]
  onAssign: (playerId: number, position: string) => void
  onUnassign: (slotId: number) => void
  busy: boolean
}

// Diamond geometry (square rotated 45°):
//   Home: (50, 87)  1B: (72, 65)  2B: (50, 43)  3B: (28, 65)
// The home→1B and home→3B edges ARE the foul lines (slope ±1), which
// extend to the outfield corners at (100, 37) and (0, 37) respectively.
function FieldSvg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Outfield fence — arc anchored at the foul-line corners */}
      <path d="M 0 37 Q 50 -4 100 37" fill="none" stroke="#6aad4a" strokeWidth="0.8" />

      {/* Foul lines: home → outfield corner, passing through 1B / 3B */}
      <line x1="50" y1="87" x2="100" y2="37" stroke="#6aad4a" strokeWidth="0.6" />
      <line x1="50" y1="87" x2="0"   y2="37" stroke="#6aad4a" strokeWidth="0.6" />

      {/* Infield dirt */}
      <polygon points="50,87 72,65 50,43 28,65" fill="#c8a46e" fillOpacity="0.35" />

      {/* Baselines (the infield square — same edges as the foul lines between bases) */}
      <polygon points="50,87 72,65 50,43 28,65" fill="none" stroke="#9a7a50" strokeWidth="0.6" />

      {/* Pitcher's mound */}
      <ellipse cx="50" cy="65" rx="3" ry="2" fill="#c0935a" fillOpacity="0.5" />

      {/* Bases */}
      {/* 1B — on the right foul line */}
      <rect x="70" y="63" width="4" height="4" fill="white" stroke="#aaa" strokeWidth="0.4" transform="rotate(45 72 65)" />
      {/* 2B */}
      <rect x="48" y="41" width="4" height="4" fill="white" stroke="#aaa" strokeWidth="0.4" transform="rotate(45 50 43)" />
      {/* 3B — on the left foul line */}
      <rect x="26" y="63" width="4" height="4" fill="white" stroke="#aaa" strokeWidth="0.4" transform="rotate(45 28 65)" />
      {/* Home plate */}
      <polygon points="50,84 53.5,87 53.5,90.5 46.5,90.5 46.5,87" fill="white" stroke="#aaa" strokeWidth="0.4" />
    </svg>
  )
}

// Show first name only; fall back to "First Last" when two players at the
// same position share the same first name.
function getCardName(player: Player, peers: Player[]): string {
  const parts = player.name.trim().split(/\s+/)
  const first = parts[0]
  const collision = peers.some(
    (p) => p.id !== player.id && p.name.trim().split(/\s+/)[0] === first,
  )
  return collision && parts.length > 1 ? `${first} ${parts[parts.length - 1]}` : first
}

export default function DiamondView({ availablePlayers, slots, onAssign, onUnassign, busy }: Props) {
  return (
    <div className="relative w-full min-h-[580px] bg-green-50 rounded-lg border border-green-200">
      <FieldSvg />
      {POSITIONS.map((pos) => {
        const playersAtPos = availablePlayers.filter((p) =>
          p.capable_positions?.includes(pos.key),
        )

        return (
          <div
            key={pos.key}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.left, top: pos.top }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-green-800">{pos.key}</span>
              <div className="flex flex-col gap-1">
                {playersAtPos.map((player) => {
                  const label = getCardName(player, playersAtPos)
                  const assignedSlot = slots.find(
                    (s) => s.player_id === player.id && s.fielding_position === pos.key,
                  )
                  const takenElsewhere = !assignedSlot && slots.some(
                    (s) => s.player_id === player.id,
                  )

                  if (takenElsewhere) {
                    return (
                      <div
                        key={player.id}
                        className="px-2 py-1 rounded text-xs border border-transparent bg-gray-100 text-gray-400 pointer-events-none"
                      >
                        {label}
                      </div>
                    )
                  }

                  if (assignedSlot) {
                    return (
                      <button
                        key={player.id}
                        disabled={busy}
                        onClick={() => onUnassign(assignedSlot.id)}
                        className="px-2 py-1 rounded text-xs border border-transparent bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                      >
                        {label}
                      </button>
                    )
                  }

                  return (
                    <button
                      key={player.id}
                      disabled={busy}
                      onClick={() => onAssign(player.id, pos.key)}
                      className="px-2 py-1 rounded text-xs bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
