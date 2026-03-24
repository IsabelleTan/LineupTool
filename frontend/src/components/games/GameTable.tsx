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
  onDuplicate: (game: Game) => void
  onDelete: (game: Game) => void
}

export default function GameTable({ games, onView, onEdit, onDuplicate, onDelete }: Props) {
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
          <TableHead className="w-8">#</TableHead>
          <TableHead>Opponent</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Home/Away</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {games.map((game) => (
          <TableRow
            key={game.id}
            className="group cursor-pointer"
            onClick={() => onView(game)}
          >
            <TableCell>{formatDate(game.game_date)}</TableCell>
            <TableCell className="text-muted-foreground">{game.game_number ?? '—'}</TableCell>
            <TableCell className="font-medium">{game.opponent}</TableCell>
            <TableCell className="text-muted-foreground">{game.location ?? '—'}</TableCell>
            <TableCell>
              {game.is_home ? (
                <Badge className="bg-blue-100 text-blue-800">Home</Badge>
              ) : (
                <Badge variant="secondary">Away</Badge>
              )}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onView(game) }}
              >
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onEdit(game) }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDuplicate(game) }}
              >
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDelete(game) }}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
