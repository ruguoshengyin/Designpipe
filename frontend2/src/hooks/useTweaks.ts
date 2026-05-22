import { useState, useCallback } from 'react'

export function useTweaks(defaults: Record<string, any>) {
  const [values, setValues] = useState(defaults)
  const setTweak = useCallback((keyOrEdits: any, val?: any) => {
    const edits =
      typeof keyOrEdits === 'object' && keyOrEdits !== null
        ? keyOrEdits
        : { [keyOrEdits]: val }
    setValues((prev: any) => ({ ...prev, ...edits }))
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*')
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }))
  }, [])
  return [values, setTweak] as const
}
