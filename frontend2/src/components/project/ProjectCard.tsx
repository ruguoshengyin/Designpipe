import React from 'react'
import { Icon } from '../ui'
import { StatusPill } from './StatusPill'
import { ProgressStrip } from './ProgressStrip'

interface Project {
  id: string
  title: string
  tag: string
  status: string
  product: string
  targetUser: string
  currentStep: number
  maxStep: number
  collaborators: string[]
  direction?: string
  updatedAt: string
  [key: string]: any
}

interface ProjectCardProps {
  project: Project
  onOpen: () => void
  index: number
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project: p, onOpen, index }) => {
  const [hovered, setHovered] = React.useState(false)
  const isExample = p.id === 'iphone15'

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="card-animate"
      style={{
        animationDelay: `${index * 60}ms`,
        background: 'white',
        borderRadius: 18,
        border: `1px solid ${hovered ? 'var(--bd-2)' : 'var(--bd-1)'}`,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 7px', borderRadius: 5,
                background: 'rgba(0,0,0,0.04)', fontSize: 10.5, fontWeight: 500,
                color: 'var(--tx-3)',
              }}>{p.tag}</span>
              {isExample && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 7px', borderRadius: 5,
                  background: 'color-mix(in srgb, var(--ac) 12%, white)',
                  fontSize: 10.5, fontWeight: 600,
                  color: 'var(--ac)',
                }}>示例</span>
              )}
            </div>
            <StatusPill status={p.status} />
          </div>
          <div style={{
            fontSize: 14.5, fontWeight: 650, color: 'var(--tx-1)',
            lineHeight: 1.35, letterSpacing: -0.01,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {p.title}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx-4)', marginTop: 4 }}>
            {p.product}
          </div>
        </div>
      </div>

      {/* Progress */}
      <ProgressStrip
        current={p.currentStep}
        max={p.maxStep}
        steps={window.DPData.steps}
      />

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 12,
        borderTop: '1px solid rgba(0,0,0,0.05)',
      }}>
        <span style={{ fontSize: 11.5, color: 'var(--tx-4)' }}>{p.collaborators.length} 人协作</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: 'var(--tx-4)' }}>
          {p.direction && (
            <span style={{
              fontWeight: 600, color: 'var(--ac)',
              padding: '2px 8px', borderRadius: 5,
              background: 'color-mix(in srgb, var(--ac) 10%, white)',
              fontSize: 11,
            }}>方向 {p.direction}</span>
          )}
          <span>{p.updatedAt}</span>
        </div>
      </div>
    </div>
  )
}

interface NewProjectCardProps {
  onClick: () => void
}

export const NewProjectCard: React.FC<NewProjectCardProps> = ({ onClick }) => {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'white' : 'rgba(255,255,255,0.5)',
        border: `1.5px dashed ${hovered ? 'var(--ac)' : 'var(--bd-1)'}`,
        borderRadius: 18, minHeight: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: hovered ? 'color-mix(in srgb, var(--ac) 10%, white)' : 'rgba(0,0,0,0.04)',
        border: `1.5px dashed ${hovered ? 'var(--ac)' : 'rgba(0,0,0,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered ? 'var(--ac)' : 'var(--tx-4)',
        transition: 'all 0.2s ease',
      }}>
        <Icon name="plus" size={22} />
      </div>
      <div>
        <div style={{
          fontSize: 13.5, fontWeight: 600,
          color: hovered ? 'var(--ac)' : 'var(--tx-3)',
          textAlign: 'center', marginBottom: 4,
          transition: 'color 0.2s',
        }}>新建设计项目</div>
        <div style={{
          fontSize: 11.5, color: 'var(--tx-4)',
          textAlign: 'center', maxWidth: 160,
        }}>从需求开始 · 走完 5 步或只取所需</div>
      </div>
    </button>
  )
}

export default ProjectCard
