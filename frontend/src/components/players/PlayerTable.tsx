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

interface Props {
  players: Player[]
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
  emptyMessage?: string
  showLicense?: boolean
  showPositions?: boolean
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active')
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
  if (status === 'Injured')
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Injured</Badge>
  return <Badge variant="secondary">Inactive</Badge>
}

export default function PlayerTable({ players, onEdit, onDelete, emptyMessage = 'None yet.', showLicense = true, showPositions = true }: Props) {
  // Name absorbs the % of any hidden columns so Status/Actions stay at the same
  // absolute position in both the Players and Staff tables.
  let namePct = 25
  if (!showLicense) namePct += 15
  if (!showPositions) namePct += 20

  if (players.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-2">
        {emptyMessage}
      </p>
    )
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: '5%' }}>#</TableHead>
          <TableHead style={{ width: `${namePct}%` }}>Name</TableHead>
          {showLicense && <TableHead style={{ width: '15%' }}>License</TableHead>}
          {showPositions && <TableHead style={{ width: '20%' }}>Positions</TableHead>}
          <TableHead style={{ width: '15%' }}>Status</TableHead>
          <TableHead style={{ width: '20%' }} className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => (
          <TableRow key={player.id}>
            <TableCell className="text-muted-foreground">{player.jersey_number ?? '—'}</TableCell>
            <TableCell className="font-medium">{player.name}</TableCell>
            {showLicense && <TableCell className="text-muted-foreground">{player.license_number ?? '—'}</TableCell>}
            {showPositions && <TableCell>{player.capable_positions?.join(', ') ?? '—'}</TableCell>}
            <TableCell>
              <StatusBadge status={player.status} />
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(player)}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(player)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
