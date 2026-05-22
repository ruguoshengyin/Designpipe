import React from 'react'
import { Icon } from './Icon'

interface ChipProps {
  children?: React.ReactNode
  active?: boolean
  onClick?: () => void
  icon?: string
  removable?: boolean
  onRemove?: () => void
  tone?: 'default' | 'accent' | 'warn' | 'ok'
}

export const Chip: React.FC<ChipProps> = ({ children, active, onClick, icon, removable, onRemove, tone = 'default' }) => {
  const tones: Record<string, any> = {
    default: { bg: 'var(--bg-2)', color: 'var(--tx-2)', bd: 'var(--bd-1)' },
    accent: { bg: 'var(--ac-soft)', color: 'var(--ac)', bd: 'var(--ac-line)' },
    warn: { bg: 'var(--warn-soft)', color: 'var(--warn)', bd: 'var(--warn)' },
    ok: { bg: 'var(--ok-soft)', color: 'var(--ok)', bd: 'var(--ok)' },
  }
  const t = active ? tones.accent : tones[tone]
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 28, padding: '0 10px',
        fontSize: 12, fontWeight: 500,
        color: t.color, background: t.bg,
        border: `1px solid ${t.bd}`,
        borderRadius: 999,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove && onRemove() }}
          style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, marginLeft: 2, display: 'inline-flex', cursor: 'pointer', opacity: 0.7 }}
        ><Icon name="x" size={11} /></button>
      )}
    </span>
  )
}

export default Chip
