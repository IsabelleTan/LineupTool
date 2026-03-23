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
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active')
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
  if (status === 'Injured')
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Injured</Badge>
  return <Badge variant="secondary">Inactive</Badge>
}

export default function PlayerTable({ players, onEdit, onDelete }: Props) {
  if (players.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No players yet. Add one to get started.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>License</TableHead>
          <TableHead>Positions</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => (
          <TableRow key={player.id}>
            <TableCell className="text-muted-foreground">{player.jersey_number ?? '—'}</TableCell>
            <TableCell className="font-medium">{player.name}</TableCell>
            <TableCell className="text-muted-foreground">{player.license_number ?? '—'}</TableCell>
            <TableCell>{player.capable_positions?.join(', ') ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{player.role}</TableCell>
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
