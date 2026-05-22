import React from 'react'
import { Icon } from '../ui'

interface Step {
  idx: number
  name: string
  [key: string]: any
}

interface PipelineStripProps {
  steps: Step[]
  currentStep: number
  completedStep: number
  onSelect: (idx: number) => void
}

export const PipelineStrip: React.FC<PipelineStripProps> = ({ steps, currentStep, completedStep, onSelect }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
      {steps.map((step, i) => {
        const status =
          step.idx <= completedStep ? 'done' :
          step.idx === currentStep ? 'current' :
          'pending'
        const active = step.idx === currentStep
        const isLast = i === steps.length - 1
        const isDone = status === 'done'
        return (
          <React.Fragment key={step.idx}>
            <button onClick={() => onSelect(step.idx)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px', borderRadius: 8,
              background: active ? 'var(--ac-soft)' : 'transparent',
              border: `1px solid ${active ? 'var(--ac-line)' : 'transparent'}`,
              color: 'inherit', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .18s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' } }}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: isDone ? 'var(--ac)' : (active ? 'var(--ac)' : 'var(--bg-2)'),
                color: isDone || active ? 'white' : 'var(--tx-4)',
                border: isDone || active ? 'none' : '1px solid var(--bd-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                flexShrink: 0,
                transition: 'all .15s',
              }}>
                {isDone ? <Icon name="check" size={11} /> : step.idx}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
                <div style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? 'var(--tx-1)' : (isDone ? 'var(--tx-2)' : 'var(--tx-4)'), letterSpacing: -0.01 }}>{step.name}</div>
              </div>
            </button>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, minWidth: 12,
                background: isDone
                  ? 'linear-gradient(90deg, var(--ac), color-mix(in srgb, var(--ac) 60%, transparent))'
                  : 'var(--bg-3)',
                borderRadius: 1,
                margin: '0 2px',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default PipelineStrip
