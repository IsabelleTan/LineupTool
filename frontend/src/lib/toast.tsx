export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-md text-sm shadow-lg">
      {message}
    </div>
  )
}
