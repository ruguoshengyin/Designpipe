import React from 'react'
import { Icon } from '../../ui'
import { Card } from '../../ui'

// ── PrevStepHint ─────────────────────────────────────────────────────────────

interface PrevStepHintProps {
  label: string
  linkTo?: string
}

export const PrevStepHint: React.FC<PrevStepHintProps> = ({ label }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 12px', borderRadius: 999,
    background: 'var(--bg-2)', border: '1px solid var(--bd-1)',
    fontSize: 11.5, color: 'var(--tx-3)', alignSelf: 'flex-start',
  }}>
    <Icon name="chevron-left" size={11} style={{ color: 'var(--ac)' }} />
    <span>{label}</span>
  </div>
)

// ── RightRail ─────────────────────────────────────────────────────────────────

interface RightRailProps {
  children?: React.ReactNode
}

export const RightRail: React.FC<RightRailProps> = ({ children }) => (
  <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>
    {children}
  </aside>
)

// ── RailSection ───────────────────────────────────────────────────────────────

interface RailSectionProps {
  title: string
  children?: React.ReactNode
  defaultOpen?: boolean
}

export const RailSection: React.FC<RailSectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <Card style={{ padding: 16 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
        marginBottom: open ? 12 : 0,
      }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.08, textTransform: 'uppercase' }}>{title}</div>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} style={{ color: 'var(--tx-4)' }} />
      </button>
      {open && <div>{children}</div>}
    </Card>
  )
}

// ── RailRow ───────────────────────────────────────────────────────────────────

interface RailRowProps {
  label: string
  value: string
}

export const RailRow: React.FC<RailRowProps> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', fontSize: 12, borderBottom: '1px dashed var(--bd-1)' }}>
    <span style={{ color: 'var(--tx-4)', flexShrink: 0 }}>{label}</span>
    <span style={{ color: 'var(--tx-1)', textAlign: 'right', lineHeight: 1.5 }}>{value}</span>
  </div>
)

// ── PrevList ──────────────────────────────────────────────────────────────────

interface PrevListProps {
  items: string[]
}

export const PrevList: React.FC<PrevListProps> = ({ items }) => (
  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.7 }}>
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
)
