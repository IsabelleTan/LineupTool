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
