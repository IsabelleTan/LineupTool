import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { importFromTeamsnap, type ImportResult } from '@/api/import'
import { downloadBackup, restoreBackup } from '@/api/backup'

function FileInput({
  label,
  description,
  accept,
  file,
  onChange,
}: {
  label: string
  description: string
  accept: string
  file: File | undefined
  onChange: (file: File | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-1">
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-3 mt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Choose file
        </Button>
        <span className="text-sm text-muted-foreground">
          {file ? file.name : 'No file chosen'}
        </span>
        {file && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange(undefined)
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            ✕
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
    </div>
  )
}

function TeamSnapSection() {
  const [roster, setRoster] = useState<File | undefined>()
  const [schedule, setSchedule] = useState<File | undefined>()
  const [availability, setAvailability] = useState<File | undefined>()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await importFromTeamsnap({ roster, schedule, availability })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const hasFile = roster || schedule || availability

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">TeamSnap Import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All files are optional. Upload whichever you have — existing records are
          updated or skipped automatically.
        </p>
      </div>

      <div className="rounded-md border p-4 text-sm space-y-2">
        <p className="font-medium">How to export from TeamSnap</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Roster:</span> Roster tab
            &rarr; Export &rarr; Export CSV
            <span className="ml-1 text-xs">(adds jersey numbers &amp; positions)</span>
          </li>
          <li>
            <span className="font-medium text-foreground">Schedule:</span> Schedule tab
            &rarr; Settings icon &rarr; Export Text File, save as CSV
            <span className="ml-1 text-xs">(adds game locations)</span>
          </li>
          <li>
            <span className="font-medium text-foreground">Availability:</span>{' '}
            Availability tab &rarr; Export &rarr; Download CSV
            <span className="ml-1 text-xs">(creates players, games &amp; availability)</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <FileInput
          label="Roster CSV"
          description="Adds jersey numbers and positions to players"
          accept=".csv,.txt"
          file={roster}
          onChange={setRoster}
        />
        <FileInput
          label="Schedule CSV"
          description="Adds locations to games"
          accept=".csv,.txt"
          file={schedule}
          onChange={setSchedule}
        />
        <FileInput
          label="Availability CSV"
          description="Creates players, upcoming games, and availability"
          accept=".csv,.txt"
          file={availability}
          onChange={setAvailability}
        />
      </div>

      <Button onClick={() => void handleImport()} disabled={!hasFile || loading}>
        {loading ? 'Importing…' : 'Import'}
      </Button>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Import failed</p>
          <p className="text-sm text-destructive mt-1 break-all">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 space-y-3">
          <p className="font-medium text-green-700 dark:text-green-400">Import complete</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <span className="text-muted-foreground">Players added</span>
            <span>{result.players_added}</span>
            <span className="text-muted-foreground">Players skipped</span>
            <span>{result.players_skipped}</span>
            <span className="text-muted-foreground">Games added</span>
            <span>{result.games_added}</span>
            <span className="text-muted-foreground">Games skipped</span>
            <span>{result.games_skipped}</span>
            <span className="text-muted-foreground">Availability added</span>
            <span>{result.availability_added}</span>
            <span className="text-muted-foreground">Availability skipped</span>
            <span>{result.availability_skipped}</span>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Warnings ({result.errors.length})
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function BackupSection() {
  const [restoreFile, setRestoreFile] = useState<File | undefined>()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRestore() {
    if (!restoreFile) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await restoreBackup(restoreFile)
      setSuccess(true)
      setRestoreFile(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Backup & Restore</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a snapshot of your entire database or restore from a previous backup.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="font-medium text-sm">Export database</p>
          <p className="text-xs text-muted-foreground">
            Downloads all players, games, availability, and lineups as a single file.
          </p>
          <div className="mt-1">
            <Button variant="outline" onClick={downloadBackup}>
              Download backup
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <FileInput
            label="Restore from backup"
            description="Upload a previously downloaded backup file to replace all current data."
            accept=".db"
            file={restoreFile}
            onChange={(f) => { setRestoreFile(f); setSuccess(false); setError(null) }}
          />
          <Button
            variant="destructive"
            disabled={!restoreFile || loading}
            onClick={() => void handleRestore()}
          >
            {loading ? 'Restoring…' : 'Restore'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Restore failed</p>
          <p className="text-sm text-destructive mt-1 break-all">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Database restored successfully. Refresh the page to see the restored data.
          </p>
        </div>
      )}
    </section>
  )
}

export default function ImportPage() {
  return (
    <div className="max-w-xl space-y-10">
      <h1 className="text-2xl font-semibold">Data</h1>
      <TeamSnapSection />
      <hr />
      <BackupSection />
    </div>
  )
}
