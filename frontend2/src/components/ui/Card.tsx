import React from 'react'

interface CardProps {
  children?: React.ReactNode
  style?: React.CSSProperties
  padded?: boolean
  hover?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, style, padded = true, hover, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-0)',
      border: '1px solid var(--bd-1)',
      borderRadius: 'var(--radius-l)',
      padding: padded ? 'var(--pad-card)' : 0,
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: 'var(--shadow-xs)',
      transition: 'border-color .18s, transform .18s, background .18s, box-shadow .18s',
      ...(style || {}),
    }}
    onMouseEnter={(e) => { if (hover && onClick) { (e.currentTarget as any).style.borderColor = 'var(--bd-2)'; (e.currentTarget as any).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as any).style.transform = 'translateY(-1px)' } }}
    onMouseLeave={(e) => { if (hover && onClick) { (e.currentTarget as any).style.borderColor = 'var(--bd-1)'; (e.currentTarget as any).style.boxShadow = 'var(--shadow-xs)'; (e.currentTarget as any).style.transform = 'none' } }}
  >
    {children}
  </div>
)

export default Card
