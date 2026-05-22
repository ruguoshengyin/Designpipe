import React from 'react'
import { Icon } from '../ui'

interface GeneratingProps {
  label?: string
}

export const Generating: React.FC<GeneratingProps> = ({ label = 'AI 正在生成…' }) => (
  <div style={{
    position: 'absolute', inset: 0, background: 'var(--bg-0)',
    backdropFilter: 'blur(2px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 14, zIndex: 50, opacity: 0.92,
  }}>
    <div style={{ position: 'relative', width: 60, height: 60 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 999,
        border: '2px solid var(--ac-line)', borderTopColor: 'var(--ac)',
        animation: 'spin 1.2s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 12, borderRadius: 999,
        background: 'var(--ac-soft)', color: 'var(--ac)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon name="sparkles" size={18} /></div>
    </div>
    <div className="mono pulse" style={{ fontSize: 12, color: 'var(--ac)', letterSpacing: 0.08 }}>{label}</div>
  </div>
)

export default Generating
