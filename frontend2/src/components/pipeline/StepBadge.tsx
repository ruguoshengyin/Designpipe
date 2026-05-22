import React from 'react'
import { Icon, Spinner } from '../ui'

interface StepBadgeProps {
  status: 'done' | 'current' | 'pending' | 'running'
  idx: number
  active?: boolean
}

export const StepBadge: React.FC<StepBadgeProps> = ({ status, idx, active }) => {
  const map = {
    done:    { bg: 'var(--ac)', color: 'var(--bg-0)', bd: 'var(--ac)' },
    current: { bg: 'var(--bg-1)', color: 'var(--ac)', bd: 'var(--ac)' },
    running: { bg: 'var(--bg-1)', color: 'var(--ac)', bd: 'var(--ac)' },
    pending: { bg: 'var(--bg-1)', color: 'var(--tx-4)', bd: 'var(--bd-1)' },
  }
  const s = map[status]
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: s.bg, color: s.color,
      border: `1.5px solid ${s.bd}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)',
      flexShrink: 0, position: 'relative',
      outline: active ? '2px solid var(--ac)' : 'none',
      outlineOffset: 2,
      transition: 'outline .2s',
    }}>
      {status === 'done' ? <Icon name="check" size={14} /> :
       status === 'running' ? <Spinner size={12} /> :
       idx}
    </div>
  )
}

export default StepBadge
