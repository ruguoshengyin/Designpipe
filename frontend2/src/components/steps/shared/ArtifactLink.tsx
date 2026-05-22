import React from 'react'
import { Icon } from '../../ui'

interface ArtifactLinkProps {
  icon: string
  label: string
  onClick?: () => void
}

export const ArtifactLink: React.FC<ArtifactLinkProps> = ({ icon, label, onClick }) => (
  <a href="#" onClick={e => { e.preventDefault(); onClick && onClick() }} style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'var(--bg-2)', border: '1px solid var(--bd-1)', borderRadius: 8,
    fontSize: 12, color: 'var(--tx-2)', textDecoration: 'none', marginBottom: 6,
    transition: 'background .15s',
  }}
  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}
  >
    <Icon name={icon} size={13} style={{ color: 'var(--ac)' }} />
    <span style={{ flex: 1 }}>{label}</span>
    <Icon name="download" size={12} style={{ color: onClick ? 'var(--ac)' : 'var(--tx-4)' }} />
  </a>
)

export default ArtifactLink
