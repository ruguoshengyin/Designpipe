import React from 'react'

interface AvatarGroupProps {
  names: string[]
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ names }) => {
  const palettes = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {names.map((c, i) => (
        <div key={i} style={{
          width: 24, height: 24, borderRadius: 999,
          background: palettes[i % palettes.length],
          color: 'white', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white',
          marginLeft: i === 0 ? 0 : -8, zIndex: names.length - i,
          position: 'relative',
        }}>{c}</div>
      ))}
      <span style={{ fontSize: 11.5, color: 'var(--tx-4)', marginLeft: 8 }}>
        {names.length} 人
      </span>
    </div>
  )
}

export default AvatarGroup
