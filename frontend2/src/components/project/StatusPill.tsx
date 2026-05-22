import React from 'react'

export const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  '进行中':  { dot: '#3b82f6', bg: '#eff6ff', text: '#2563eb', label: '进行中' },
  '草稿':    { dot: '#9ca3af', bg: '#f9fafb', text: '#6b7280', label: '草稿'   },
  '高保真中':{ dot: '#f59e0b', bg: '#fffbeb', text: '#d97706', label: '高保真' },
  '已交付':  { dot: '#10b981', bg: '#f0fdf4', text: '#059669', label: '已交付' },
}

interface StatusPillProps {
  status: string
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['草稿']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 999,
      background: cfg.bg, fontSize: 11, fontWeight: 600,
      color: cfg.text, whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: 999,
        background: cfg.dot, display: 'inline-block',
      }} />
      {cfg.label}
    </span>
  )
}

export default StatusPill
