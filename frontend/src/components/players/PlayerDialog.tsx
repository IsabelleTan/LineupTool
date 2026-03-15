import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Player, PlayerCreate } from '@/api/players'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: PlayerCreate) => Promise<void>
  player?: Player
}

interface FormState {
  name: string
  jersey_number: string
  preferred_position: string
  capable_positions: string
  is_active: boolean
}

function toFormState(player?: Player): FormState {
  return {
    name: player?.name ?? '',
    jersey_number: player?.jersey_number ?? '',
    preferred_position: player?.preferred_position ?? '',
    capable_positions: player?.capable_positions?.join(', ') ?? '',
    is_active: player?.is_active ?? true,
  }
}

export default function PlayerDialog({ open, onClose, onSubmit, player }: Props) {
  const [form, setForm] = useState<FormState>(toFormState(player))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(toFormState(player))
      setError(null)
    }
  }, [open, player])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const positions = form.capable_positions
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      await onSubmit({
        name: form.name.trim(),
        jersey_number: form.jersey_number.trim() || null,
        preferred_position: form.preferred_position.trim() || null,
        capable_positions: positions.length ? positions : null,
        is_active: form.is_active,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = !!player

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Player' : 'Add Player'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="jersey_number">Jersey #</Label>
            <Input
              id="jersey_number"
              name="jersey_number"
              value={form.jersey_number}
              onChange={handleChange}
              placeholder="e.g. 42"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preferred_position">Preferred Position</Label>
            <Input
              id="preferred_position"
              name="preferred_position"
              value={form.preferred_position}
              onChange={handleChange}
              placeholder="e.g. SS"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="capable_positions">Capable Positions</Label>
            <Input
              id="capable_positions"
              name="capable_positions"
              value={form.capable_positions}
              onChange={handleChange}
              placeholder="e.g. SS, 2B, CF"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, is_active: checked === true }))
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
