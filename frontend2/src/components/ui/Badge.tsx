import React from 'react'

interface BadgeProps {
  children?: React.ReactNode
  tone?: 'default' | 'accent' | 'warn' | 'danger' | 'ok' | 'outline'
  style?: React.CSSProperties
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'default', style }) => {
  const tones: Record<string, any> = {
    default: { bg: 'var(--bg-2)', color: 'var(--tx-2)', bd: 'var(--bd-1)' },
    accent: { bg: 'var(--ac-soft)', color: 'var(--ac)', bd: 'var(--ac-line)' },
    warn: { bg: 'var(--warn-soft)', color: 'var(--warn)', bd: 'transparent' },
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)', bd: 'transparent' },
    ok: { bg: 'var(--ok-soft)', color: 'var(--ok)', bd: 'transparent' },
    outline: { bg: 'transparent', color: 'var(--tx-2)', bd: 'var(--bd-1)' },
  }
  const t = tones[tone] || tones.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 22, padding: '0 8px',
      fontSize: 11, fontWeight: 500,
      color: t.color, background: t.bg,
      border: `1px solid ${t.bd}`,
      borderRadius: 6,
      letterSpacing: 0.02,
      ...(style || {}),
    }}>{children}</span>
  )
}

export default Badge
