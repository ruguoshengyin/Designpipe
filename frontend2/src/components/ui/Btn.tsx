import React from 'react'
import { Icon } from './Icon'

interface BtnProps {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconRight?: string
  onClick?: (e: React.MouseEvent) => void
  active?: boolean
  disabled?: boolean
  style?: React.CSSProperties
  title?: string
  type?: 'button' | 'submit' | 'reset'
}

export const Btn: React.FC<BtnProps> = ({
  children, variant = 'ghost', size = 'md', icon, iconRight,
  onClick, active, disabled, style, title, type
}) => {
  const sizes: Record<string, any> = {
    sm: { h: 28, px: 10, fs: 12, gap: 5, r: 7 },
    md: { h: 32, px: 14, fs: 13, gap: 7, r: 8 },
    lg: { h: 40, px: 18, fs: 14, gap: 9, r: 10 },
  }
  const s = sizes[size]
  const variants: Record<string, any> = {
    primary: { bg: 'var(--ac)', color: '#fff', bd: 'var(--ac)', shadow: '0 1px 3px rgba(204,120,92,0.35), 0 2px 8px rgba(204,120,92,0.18)' },
    secondary: { bg: 'var(--bg-2)', color: 'var(--tx-1)', bd: 'var(--bd-1)', shadow: 'none' },
    ghost: { bg: 'transparent', color: 'var(--tx-2)', bd: 'transparent', shadow: 'none' },
    outline: { bg: 'var(--bg-0)', color: 'var(--tx-1)', bd: 'var(--bd-1)', shadow: 'var(--shadow-xs)' },
    soft: { bg: 'var(--ac-soft)', color: 'var(--ac)', bd: 'var(--ac-line)', shadow: 'none' },
    danger: { bg: 'transparent', color: 'var(--danger)', bd: 'var(--bd-1)', shadow: 'none' },
  }
  const v = variants[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      type={type || 'button'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: s.gap,
        height: s.h, padding: `0 ${s.px}px`,
        fontSize: s.fs, fontWeight: 500,
        color: active ? 'var(--ac)' : v.color,
        background: active ? 'var(--ac-soft)' : v.bg,
        border: `1px solid ${active ? 'var(--ac-line)' : v.bd}`,
        borderRadius: s.r,
        boxShadow: active ? 'none' : v.shadow,
        opacity: disabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
        letterSpacing: -0.01,
        transition: 'background .15s, color .15s, border-color .15s, transform .1s, box-shadow .15s, opacity .15s',
        ...(style || {}),
      }}
      onMouseEnter={(e) => { if (!disabled && variant === 'ghost') (e.currentTarget as any).style.background = 'var(--bg-2)' }}
      onMouseLeave={(e) => { if (!disabled && variant === 'ghost' && !active) (e.currentTarget as any).style.background = 'transparent'; (e.currentTarget as any).style.transform = 'none' }}
      onMouseDown={(e) => { if (!disabled) (e.currentTarget as any).style.transform = 'translateY(0.5px) scale(0.99)' }}
      onMouseUp={(e) => { (e.currentTarget as any).style.transform = 'none' }}
    >
      {icon && <Icon name={icon} size={s.fs + 2} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={s.fs + 2} />}
    </button>
  )
}

export default Btn
