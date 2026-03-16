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
import type { Game } from '@/api/games'
import { formatDate } from '@/lib/utils'

interface Props {
  games: Game[]
  onView: (game: Game) => void
  onEdit: (game: Game) => void
  onDelete: (game: Game) => void
}

function StatusBadge({ status }: { status: Game['status'] }) {
  if (status === 'completed') {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
  }
  if (status === 'cancelled') {
    return <Badge variant="secondary">Cancelled</Badge>
  }
  return <Badge variant="outline">Scheduled</Badge>
}

export default function GameTable({ games, onView, onEdit, onDelete }: Props) {
  if (games.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">No games yet.</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Opponent</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Home/Away</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {games.map((game) => (
          <TableRow key={game.id}>
            <TableCell>
              {formatDate(game.game_date)}
            </TableCell>
            <TableCell className="font-medium">{game.opponent}</TableCell>
            <TableCell className="text-muted-foreground">{game.location ?? '—'}</TableCell>
            <TableCell>
              {game.is_home ? (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Home</Badge>
              ) : (
                <Badge variant="secondary">Away</Badge>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={game.status} />
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button size="sm" variant="outline" onClick={() => onView(game)}>
                View
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(game)}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(game)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
