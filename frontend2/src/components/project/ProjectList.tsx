import React from 'react'

interface Project {
  id: string
  title: string
  product: string
  targetUser: string
  currentStep: number
  maxStep: number
  direction?: string
  updatedAt: string
  [key: string]: any
}

interface ProjectListProps {
  projects: Project[]
  onOpen: (id: string) => void
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onOpen }) => (
  <div style={{
    background: 'white', borderRadius: 16,
    border: '1px solid var(--bd-1)',
    overflow: 'hidden',
  }}>
    {/* Header */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.2fr 1fr 2fr 0.7fr 0.8fr',
      padding: '10px 20px', gap: 16,
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      fontSize: 10.5, color: 'var(--tx-4)',
      fontWeight: 600, letterSpacing: 0.06,
      textTransform: 'uppercase',
      fontFamily: 'var(--mono)',
    }}>
      <div>项目</div><div>产品</div><div>进度</div><div>方向</div><div>更新</div>
    </div>
    {projects.map((p, i) => (
      <div
        key={p.id}
        onClick={() => onOpen(p.id)}
        style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 1fr 2fr 0.7fr 0.8fr',
          padding: '14px 20px', gap: 16, alignItems: 'center',
          borderBottom: i < projects.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
          cursor: 'pointer', fontSize: 13, transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--tx-1)', fontSize: 13 }}>{p.title}</div>
            <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 2 }}>{p.targetUser}</div>
          </div>
        </div>
        <div style={{ color: 'var(--tx-3)', fontSize: 12 }}>{p.product}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: 'rgba(0,0,0,0.07)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${(p.currentStep / p.maxStep) * 100}%`, height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, var(--ac), color-mix(in srgb, var(--ac) 80%, #fff))',
            }} />
          </div>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--tx-4)', whiteSpace: 'nowrap' }}>
            {p.currentStep}/{p.maxStep}
          </span>
        </div>
        <div>
          {p.direction
            ? <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--ac)',
                padding: '2px 8px', borderRadius: 5,
                background: 'color-mix(in srgb, var(--ac) 10%, white)',
              }}>方向 {p.direction}</span>
            : <span style={{ color: 'var(--tx-4)' }}>—</span>
          }
        </div>
        <div style={{ color: 'var(--tx-4)', fontSize: 11.5 }}>{p.updatedAt}</div>
      </div>
    ))}
  </div>
)

export default ProjectList
