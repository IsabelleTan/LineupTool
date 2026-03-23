import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  license_number: string
  capable_positions: string
  role: string
  status: string
}

function toFormState(player?: Player): FormState {
  return {
    name: player?.name ?? '',
    jersey_number: player?.jersey_number ?? '',
    license_number: player?.license_number ?? '',
    capable_positions: player?.capable_positions?.join(', ') ?? '',
    role: player?.role ?? 'Player',
    status: player?.status ?? 'Active',
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
        license_number: form.license_number.trim() || null,
        capable_positions: positions.length ? positions : null,
        role: form.role,
        status: form.status,
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
            <Label htmlFor="license_number">License #</Label>
            <Input
              id="license_number"
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
              placeholder="e.g. 123456"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="capable_positions">Positions</Label>
            <Input
              id="capable_positions"
              name="capable_positions"
              value={form.capable_positions}
              onChange={handleChange}
              placeholder="e.g. SS, 2B, CF"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Player">Player</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Injured">Injured</option>
            </select>
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
