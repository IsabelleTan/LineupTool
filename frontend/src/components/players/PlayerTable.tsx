import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Player } from '@/api/players'

type SortColumn = 'name' | 'number' | 'positions' | 'status' | 'license'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = { Active: 0, Injured: 1, Pregnant: 2, Inactive: 3 }

interface Props {
  players: Player[]
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
  onRowClick?: (player: Player) => void
  emptyMessage?: string
  showNumber?: boolean
  showLicense?: boolean
  showPositions?: boolean
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active')
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  if (status === 'Injured')
    return <Badge className="bg-yellow-100 text-yellow-800">Injured</Badge>
  if (status === 'Pregnant')
    return <Badge className="bg-pink-100 text-pink-800">Pregnant</Badge>
  return <Badge variant="secondary">Inactive</Badge>
}

function SortableHead({
  label, col, active, dir, onSort, style,
}: {
  label: string
  col: SortColumn
  active: boolean
  dir: SortDir
  onSort: (col: SortColumn) => void
  style?: React.CSSProperties
}) {
  return (
    <TableHead style={style} className="cursor-pointer select-none" onClick={() => onSort(col)}>
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        {active
          ? dir === 'asc'
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </TableHead>
  )
}

export default function PlayerTable({
  players, onEdit, onDelete, onRowClick,
  emptyMessage = 'None yet.',
  showNumber = true, showLicense = true, showPositions = true,
}: Props) {
  const [sortCol, setSortCol] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortCol) return players
    return [...players].sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'number':
          if (!a.jersey_number && !b.jersey_number) cmp = 0
          else if (!a.jersey_number) cmp = 1
          else if (!b.jersey_number) cmp = -1
          else cmp = a.jersey_number.localeCompare(b.jersey_number, undefined, { numeric: true })
          break
        case 'positions': {
          const ap = a.capable_positions?.join(', ') ?? ''
          const bp = b.capable_positions?.join(', ') ?? ''
          cmp = ap.localeCompare(bp)
          break
        }
        case 'status':
          cmp = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
          break
        case 'license':
          if (!a.license_number && !b.license_number) cmp = 0
          else if (!a.license_number) cmp = 1
          else if (!b.license_number) cmp = -1
          else cmp = a.license_number.localeCompare(b.license_number)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [players, sortCol, sortDir])

  if (players.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-2">{emptyMessage}</p>
    )
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <SortableHead label="Name" col="name" active={sortCol === 'name'} dir={sortDir} onSort={handleSort} style={{ width: showNumber ? '28%' : '35%' }} />
          {showNumber && <SortableHead label="#" col="number" active={sortCol === 'number'} dir={sortDir} onSort={handleSort} style={{ width: '7%' }} />}
          {showPositions && <SortableHead label="Positions" col="positions" active={sortCol === 'positions'} dir={sortDir} onSort={handleSort} style={{ width: '20%' }} />}
          <SortableHead label="Status" col="status" active={sortCol === 'status'} dir={sortDir} onSort={handleSort} style={{ width: '13%' }} />
          {showLicense && <SortableHead label="License" col="license" active={sortCol === 'license'} dir={sortDir} onSort={handleSort} style={{ width: '17%' }} />}
          <TableHead style={{ width: '15%' }} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((player) => (
          <TableRow
            key={player.id}
            className={`group ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={() => onRowClick?.(player)}
          >
            <TableCell className="font-medium">{player.name}</TableCell>
            {showNumber && <TableCell className="text-muted-foreground">{player.jersey_number ?? '—'}</TableCell>}
            {showPositions && <TableCell>{player.capable_positions?.join(', ') ?? '—'}</TableCell>}
            <TableCell>
              <StatusBadge status={player.status} />
            </TableCell>
            {showLicense && <TableCell className="text-muted-foreground">{player.license_number ?? '—'}</TableCell>}
            <TableCell className="text-right space-x-2">
              <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onEdit(player) }}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onDelete(player) }}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
