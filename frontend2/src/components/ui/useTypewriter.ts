import { useState, useEffect } from 'react'

interface TypewriterOpts {
  speed?: number
  enabled?: boolean
  onDone?: () => void
}

export function useTypewriter(text: string, opts: TypewriterOpts = {}) {
  const { speed = 16, enabled = true, onDone } = opts
  const [shown, setShown] = useState(enabled ? '' : text)
  const [done, setDone] = useState(!enabled)
  useEffect(() => {
    if (!enabled) { setShown(text); setDone(true); return }
    setShown(''); setDone(false)
    let i = 0
    const id = setInterval(() => {
      i += Math.max(1, Math.floor(text.length / 80))
      if (i >= text.length) {
        setShown(text); setDone(true); clearInterval(id)
        onDone && onDone()
      } else {
        setShown(text.slice(0, i))
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, enabled])
  return { shown, done }
}
