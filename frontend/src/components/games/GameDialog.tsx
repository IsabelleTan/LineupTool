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
import type { Game, GameCreate } from '@/api/games'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: GameCreate) => Promise<void>
  game?: Game
}

interface FormState {
  game_date: string
  opponent: string
  location: string
  is_home: boolean
  game_number: string
}

function toFormState(game?: Game): FormState {
  return {
    game_date: game?.game_date ?? '',
    opponent: game?.opponent ?? '',
    location: game?.location ?? '',
    is_home: game?.is_home ?? true,
    game_number: game?.game_number != null ? String(game.game_number) : '',
  }
}

export default function GameDialog({ open, onClose, onSubmit, game }: Props) {
  const [form, setForm] = useState<FormState>(toFormState(game))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(toFormState(game))
      setError(null)
    }
  }, [open, game])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        game_date: form.game_date,
        opponent: form.opponent.trim(),
        location: form.location.trim() || null,
        is_home: form.is_home,
        game_number: form.game_number !== '' ? Number(form.game_number) : null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = !!game
  const canSubmit = form.game_date.trim() !== '' && form.opponent.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Game' : 'Add Game'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="game_date">Date *</Label>
            <Input
              id="game_date"
              name="game_date"
              type="date"
              value={form.game_date}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="opponent">Opponent *</Label>
            <Input
              id="opponent"
              name="opponent"
              value={form.opponent}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="game_number">Game #</Label>
            <Input
              id="game_number"
              name="game_number"
              type="number"
              min={1}
              value={form.game_number}
              onChange={handleChange}
              placeholder="e.g. 1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_home"
              checked={form.is_home}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, is_home: checked === true }))
              }
            />
            <Label htmlFor="is_home">Home game</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !canSubmit}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Game'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
