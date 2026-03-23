const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api'

export function downloadBackup(): void {
  window.location.href = `${BASE_URL}/backup/export`
}
