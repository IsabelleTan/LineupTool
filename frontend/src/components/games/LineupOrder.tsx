import { useRef, useState, useEffect } from 'react'
import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'

interface Props {
  slots: LineupSlotRead[]
  players: Player[]
  onReorder?: (orderedSlotIds: number[]) => void
}

interface DragTarget {
  idx: number
  half: 'top' | 'bottom'
}

export default function LineupOrder({ slots, players, onReorder }: Props) {
  const dragFromRef = useRef<number | null>(null)
  const dragTargetRef = useRef<DragTarget | null>(null)
  const [visual, setVisual] = useState<{ from: number | null; target: DragTarget | null }>({
    from: null,
    target: null,
  })

  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  // Keep refs to the latest sorted array and callback so the native listeners
  // (set up once in useEffect) always see current values without needing to
  // re-register on every render.
  const sortedRef = useRef<LineupSlotRead[]>([])
  const onReorderRef = useRef(onReorder)

  const sorted = [...slots].sort((a, b) => a.batting_order - b.batting_order)

  // Sync mutable refs after every render so native listeners always see current values.
  useEffect(() => {
    sortedRef.current = sorted
    onReorderRef.current = onReorder
  })

  useEffect(() => {
    const tbody = tbodyRef.current
    if (!tbody) return

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
      const row = (e.target as HTMLElement).closest('tr')
      if (!row) return
      const idx = Number(row.getAttribute('data-idx'))
      const rect = row.getBoundingClientRect()
      const half: 'top' | 'bottom' = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom'
      const prev = dragTargetRef.current
      if (!prev || prev.idx !== idx || prev.half !== half) {
        dragTargetRef.current = { idx, half }
        setVisual((v) => ({ ...v, target: { idx, half } }))
      }
    }

    const onDragLeave = (e: DragEvent) => {
      if (!tbody.contains(e.relatedTarget as Node)) {
        setVisual((v) => ({ ...v, target: null }))
      }
    }

    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const dragFrom = dragFromRef.current
      const dragTarget = dragTargetRef.current
      dragFromRef.current = null
      dragTargetRef.current = null
      setVisual({ from: null, target: null })
      if (dragFrom === null || dragTarget === null) return

      const { idx: toIdx, half } = dragTarget
      const insertBefore = half === 'top' ? toIdx : toIdx + 1
      const reordered = [...sortedRef.current]
      const [moved] = reordered.splice(dragFrom, 1)
      const adjusted = dragFrom < insertBefore ? insertBefore - 1 : insertBefore
      reordered.splice(adjusted, 0, moved)
      onReorderRef.current?.(reordered.map((s) => s.id))
    }

    tbody.addEventListener('dragover', onDragOver)
    tbody.addEventListener('dragleave', onDragLeave)
    tbody.addEventListener('drop', onDrop)
    return () => {
      tbody.removeEventListener('dragover', onDragOver)
      tbody.removeEventListener('dragleave', onDragLeave)
      tbody.removeEventListener('drop', onDrop)
    }
  }, [])

  if (slots.length === 0) {
    return <p className="text-muted-foreground text-sm">No players assigned yet.</p>
  }

  function handleDragStart(e: React.DragEvent<HTMLTableRowElement>, idx: number) {
    dragFromRef.current = idx
    setVisual({ from: idx, target: null })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    dragFromRef.current = null
    dragTargetRef.current = null
    setVisual({ from: null, target: null })
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground border-b">
          <th className="text-left font-medium pb-1">Player</th>
          <th className="text-left font-medium pb-1 pl-3">Pos</th>
        </tr>
      </thead>
      <tbody ref={tbodyRef}>
        {sorted.map((slot, idx) => {
          const name = players.find((p) => p.id === slot.player_id)?.name ?? 'Unknown'
          const isTarget = visual.target?.idx === idx
          const topLine = isTarget && visual.target?.half === 'top'
          const bottomLine = isTarget && visual.target?.half === 'bottom'
          return (
            <tr
              key={slot.id}
              data-idx={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              className={[
                'border-b border-muted last:border-0 cursor-grab active:cursor-grabbing select-none',
                visual.from === idx ? 'opacity-40' : '',
                topLine ? 'border-t-2 border-t-blue-500' : '',
                bottomLine ? 'border-b-2 border-b-blue-500' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <td className="py-1">{idx + 1}. {name}</td>
              <td className="py-1 pl-3 text-muted-foreground">{slot.fielding_position}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
