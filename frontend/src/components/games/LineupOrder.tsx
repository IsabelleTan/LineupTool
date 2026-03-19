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
}

interface RowProps {
  slot: LineupSlotRead
  index: number
  name: string
}

function SortableRow({ slot, index, name }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-muted last:border-0 cursor-grab active:cursor-grabbing select-none"
      {...attributes}
      {...listeners}
      role="row"
    >
      <td className="py-1">{index + 1}. {name}</td>
      <td className="py-1 pl-3 text-muted-foreground">{slot.fielding_position}</td>
    </tr>
  )
}

export default function LineupOrder({ slots, players, availablePlayers, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor))
  const sorted = useMemo(
    () => [...slots].sort((a, b) => a.batting_order - b.batting_order),
    [slots],
  )
  const benchPlayers = useMemo(
    () => availablePlayers.filter((p) => !slots.some((s) => s.player_id === p.id)),
    [availablePlayers, slots],
  )

  if (slots.length === 0 && benchPlayers.length === 0) {
    return <p className="text-muted-foreground text-sm">No players assigned yet.</p>
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sorted.findIndex((s) => s.id === active.id)
    const newIndex = sorted.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sorted, oldIndex, newIndex)
    onReorder?.(reordered.map((s) => s.id))
  }

  return (
    <>
      {slots.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left font-medium pb-1">Player</th>
                  <th className="text-left font-medium pb-1 pl-3">Pos</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((slot, idx) => {
                  const name = players.find((p) => p.id === slot.player_id)?.name ?? 'Unknown'
                  return <SortableRow key={slot.id} slot={slot} index={idx} name={name} />
                })}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      )}
      {benchPlayers.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground font-medium border-b pb-1 mb-1">Bench</p>
          <ul className="text-sm space-y-1">
            {benchPlayers.map((p) => (
              <li key={p.id} className="text-muted-foreground">{p.name}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
