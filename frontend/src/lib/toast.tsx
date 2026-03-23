import { useState, useCallback, useEffect } from 'react'

export function useToast(duration = 3000) {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => setMessage(null), duration)
    return () => clearTimeout(id)
  }, [message, duration])

  const showToast = useCallback((msg: string) => setMessage(msg), [])
  return { toastMessage: message, showToast }
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-md text-sm shadow-lg">
      {message}
    </div>
  )
}
