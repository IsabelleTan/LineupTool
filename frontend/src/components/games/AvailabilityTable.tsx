import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Player } from '@/api/players'
import type { GameAvailability } from '@/api/availability'

interface Props {
  players: Player[]
  availability: GameAvailability[]
  onToggle: (playerId: number, availabilityId: number | null, isAvailable: boolean) => void
}

export default function AvailabilityTable({ players, availability, onToggle }: Props) {
  if (players.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">No players found.</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Jersey</TableHead>
          <TableHead>Preferred Position</TableHead>
          <TableHead>Available</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => {
          const record = availability.find((a) => a.player_id === player.id)
          const isAvailable = record?.is_available === true
          return (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {player.jersey_number ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {player.preferred_position ?? '—'}
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={isAvailable}
                  onCheckedChange={(checked) =>
                    onToggle(player.id, record?.id ?? null, checked === true)
                  }
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
