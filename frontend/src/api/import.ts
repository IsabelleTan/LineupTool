const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api'

export interface ImportResult {
  players_added: number
  players_skipped: number
  games_added: number
  games_skipped: number
  availability_added: number
  availability_skipped: number
  errors: string[]
}

export async function importFromTeamsnap(files: {
  roster?: File
  schedule?: File
  availability?: File
}): Promise<ImportResult> {
  const form = new FormData()
  if (files.roster) form.append('roster', files.roster)
  if (files.schedule) form.append('schedule', files.schedule)
  if (files.availability) form.append('availability', files.availability)

  const response = await fetch(`${BASE_URL}/import/teamsnap`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(text)
  }

  return response.json() as Promise<ImportResult>
}
