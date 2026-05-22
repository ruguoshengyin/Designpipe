import React from 'react'
import { Badge } from '../ui'
import { StepBadge } from './StepBadge'

interface Step {
  idx: number
  name: string
  desc: string
  en: string
  [key: string]: any
}

interface PipelineProps {
  steps: Step[]
  currentStep: number
  completedStep: number
  runningStep?: number
  onSelect: (idx: number) => void
}

export const Pipeline: React.FC<PipelineProps> = ({ steps, currentStep, completedStep, runningStep, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => {
        const status =
          step.idx === runningStep ? 'running' :
          step.idx <= completedStep ? 'done' :
          step.idx === currentStep ? 'current' :
          'pending'
        const active = step.idx === currentStep
        const isLast = i === steps.length - 1
        return (
          <div key={step.idx} style={{ display: 'flex', gap: 12, position: 'relative' }}>
            {/* Spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <StepBadge status={status as any} idx={step.idx} active={active} />
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 28,
                  background: step.idx < completedStep
                    ? 'var(--ac)'
                    : step.idx === completedStep
                      ? 'linear-gradient(180deg, var(--ac), var(--bd-1))'
                      : 'var(--bd-1)',
                  margin: '4px 0',
                }} />
              )}
            </div>

            {/* Content */}
            <button
              onClick={() => onSelect(step.idx)}
              style={{
                flex: 1, padding: '2px 12px 22px 0',
                background: 'transparent', border: 'none',
                textAlign: 'left', color: 'inherit', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                background: active ? 'var(--ac-soft)' : 'transparent',
                border: `1px solid ${active ? 'var(--ac-line)' : 'transparent'}`,
                borderRadius: 10, padding: '8px 12px',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 10, color: active ? 'var(--ac)' : 'var(--tx-4)', letterSpacing: 0.06 }}>
                    STEP 0{step.idx}
                  </span>
                  {status === 'done' && <Badge tone="ok" style={{ height: 16, fontSize: 9, padding: '0 5px' }}>已确认</Badge>}
                  {status === 'running' && <Badge tone="accent" style={{ height: 16, fontSize: 9, padding: '0 5px' }}>生成中</Badge>}
                  {step.idx === 3 && step.idx === currentStep && <Badge tone="warn" style={{ height: 16, fontSize: 9, padding: '0 5px' }}>需选择</Badge>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--tx-1)' : 'var(--tx-2)' }}>
                  {step.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--tx-4)', marginTop: 3, lineHeight: 1.45,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {step.desc}
                </div>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default Pipeline
