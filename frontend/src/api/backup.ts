const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api'

export function downloadBackup(): void {
  window.location.href = `${BASE_URL}/backup/export`
}

export async function restoreBackup(file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/backup/restore`, { method: 'POST', body: form })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { detail?: string }).detail ?? 'Restore failed')
  }
}
