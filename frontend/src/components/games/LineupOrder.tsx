import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'

interface Props {
  slots: LineupSlotRead[]
  players: Player[]
  availablePlayers: Player[]
  onReorder?: (orderedSlotIds: number[]) => void
  onSetFlex?: (slotId: number, isFlex: boolean) => void
  onAssignDH?: (playerId: number) => void
  onUnassignFlex?: (slotId: number) => void
  busy?: boolean
}

interface RowProps {
  slot: LineupSlotRead
  index: number
  name: string
  isOutOfPosition: boolean
  onSetFlex?: (slotId: number, isFlex: boolean) => void
  busy?: boolean
}

function SortableRow({ slot, index, name, isOutOfPosition, onSetFlex, busy }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  const isDH = slot.fielding_position === 'DH'
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-muted last:border-0 cursor-grab active:cursor-grabbing select-none"
      {...attributes}
      {...listeners}
      role="row"
    >
      <td className="py-1 w-6 text-muted-foreground text-xs">{index + 1}.</td>
      <td className="py-1">{name}</td>
      <td className={`py-1 pl-3 ${isOutOfPosition ? 'text-amber-600' : 'text-muted-foreground'}`}>
        {slot.fielding_position}
      </td>
      <td className="py-1 pl-2 text-right">
        {!isDH && (
          <button
            aria-label={slot.is_flex ? 'Unmark Flex' : 'Mark as Flex'}
            disabled={busy}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onSetFlex?.(slot.id, !slot.is_flex) }}
            className={`text-xs px-1.5 py-0.5 rounded border transition-colors disabled:opacity-30 ${
              slot.is_flex
                ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                : 'text-muted-foreground border-muted hover:bg-muted'
            }`}
          >
            F
          </button>
        )}
      </td>
    </tr>
  )
}

export default function LineupOrder({
  slots, players, availablePlayers,
  onReorder, onSetFlex, onAssignDH, onUnassignFlex, busy = false,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor))

  const flexSlot = useMemo(() => slots.find((s) => s.is_flex), [slots])
  const dhSlot = useMemo(() => slots.find((s) => s.fielding_position === 'DH'), [slots])

  // Regular batting order: all non-Flex slots (including DH), sorted by batting_order
  const regularSorted = useMemo(
    () => [...slots].filter((s) => !s.is_flex).sort((a, b) => a.batting_order - b.batting_order),
    [slots],
  )

  const benchPlayers = useMemo(
    () => availablePlayers.filter((p) => !slots.some((s) => s.player_id === p.id)),
    [availablePlayers, slots],
  )

  const flexPlayer = flexSlot ? players.find((p) => p.id === flexSlot.player_id) : null

  const showWarning = (flexSlot && !dhSlot) || (dhSlot && !flexSlot)

  if (slots.length === 0 && benchPlayers.length === 0) {
    return <p className="text-muted-foreground text-sm">Mark players available, then assign them from the diamond.</p>
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = regularSorted.findIndex((s) => s.id === active.id)
    const newIndex = regularSorted.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(regularSorted, oldIndex, newIndex)
    // Flex slot always goes last so it gets the highest batting_order
    const flexIds = flexSlot ? [flexSlot.id] : []
    onReorder?.([...reordered.map((s) => s.id), ...flexIds])
  }

  return (
    <>
      {slots.length === 0 && (
        <p className="text-muted-foreground text-sm mb-3">Assign players from the diamond to build the batting order.</p>
      )}

      {showWarning && (
        <p className="text-xs text-amber-600 mb-2">
          {flexSlot && !dhSlot
            ? 'Flex designated — assign a DH from the bench.'
            : 'DH assigned — mark a defensive player as Flex (F).'}
        </p>
      )}

      {regularSorted.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={regularSorted.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left font-medium pb-1 w-6">#</th>
                  <th className="text-left font-medium pb-1">Player</th>
                  <th className="text-left font-medium pb-1 pl-3">Pos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {regularSorted.map((slot, idx) => {
                  const player = players.find((p) => p.id === slot.player_id)
                  const name = player?.name ?? 'Unknown'
                  const isOutOfPosition = !!player && !player.capable_positions?.includes(slot.fielding_position)
                  return (
                    <SortableRow
                      key={slot.id}
                      slot={slot}
                      index={idx}
                      name={name}
                      isOutOfPosition={isOutOfPosition}
                      onSetFlex={onSetFlex}
                      busy={busy}
                    />
                  )
                })}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      )}

      {/* Flex row — always position 10, not draggable */}
      {flexSlot && (
        <div className="flex items-center gap-2 text-sm mt-1 pt-1 border-t border-muted">
          <span className="text-xs text-muted-foreground w-6">10.</span>
          <span>{flexPlayer?.name ?? 'Unknown'}</span>
          <span className="text-muted-foreground pl-3 text-xs">{flexSlot.fielding_position}</span>
          <span className="ml-1 text-xs px-1.5 py-0.5 rounded border bg-blue-100 text-blue-700 border-blue-300">F</span>
          <button
            aria-label="Unmark Flex"
            disabled={busy}
            onClick={() => onUnassignFlex?.(flexSlot.id)}
            className="ml-auto text-xs px-1.5 py-0.5 rounded border text-muted-foreground border-muted hover:bg-muted disabled:opacity-30"
          >
            ×
          </button>
        </div>
      )}

      {benchPlayers.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground font-medium border-b pb-1 mb-1">Bench</p>
          <ul className="text-sm space-y-1">
            {benchPlayers.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-muted-foreground">
                <span>
                  {p.name}
                  {p.capable_positions && p.capable_positions.length > 0 && (
                    <span className="text-xs ml-1 opacity-60">{p.capable_positions.join(', ')}</span>
                  )}
                </span>
                {!dhSlot && (
                  <button
                    aria-label={`Assign ${p.name} as DH`}
                    disabled={busy}
                    onClick={() => onAssignDH?.(p.id)}
                    className="text-xs px-1.5 py-0.5 rounded border text-muted-foreground border-muted hover:bg-muted disabled:opacity-30 ml-auto shrink-0"
                  >
                    DH
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
