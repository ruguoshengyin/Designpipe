import React from 'react'

interface SectionTitleProps {
  eyebrow?: string
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ eyebrow, title, subtitle, right }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--gap-4)', gap: 16 }}>
    <div>
      {eyebrow && (
        <div className="mono" style={{
          fontSize: 10.5, color: 'var(--ac)', letterSpacing: 0.1,
          textTransform: 'uppercase', marginBottom: 7, fontWeight: 600,
        }}>{eyebrow}</div>
      )}
      <div style={{ fontSize: 19, fontWeight: 650, color: 'var(--tx-1)', letterSpacing: -0.025, lineHeight: 1.25 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--tx-3)', marginTop: 5, lineHeight: 1.6 }}>{subtitle}</div>}
    </div>
    {right}
  </div>
)

export default SectionTitle
