import React from 'react'

interface Step {
  idx: number
  name: string
  [key: string]: any
}

interface ProgressStripProps {
  current: number
  max: number
  steps: Step[]
}

export const ProgressStrip: React.FC<ProgressStripProps> = ({ current, max, steps }) => {
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        {steps.map((s, i) => {
          const done = i < current
          const active = i === current - 1
          return (
            <div key={s.idx} style={{ flex: 1, position: 'relative' }}>
              <div style={{
                height: 5, borderRadius: 999,
                background: done
                  ? 'linear-gradient(90deg, var(--ac), color-mix(in srgb, var(--ac) 80%, #fff))'
                  : 'rgba(0,0,0,0.07)',
                position: 'relative', overflow: 'hidden',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                    animation: 'shimmer 2s ease-in-out infinite',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--tx-4)',
      }}>
        <span className="mono" style={{ fontWeight: 500 }}>
          {current} / {max} · {steps[current - 1]?.name || ''}
        </span>
      </div>
    </div>
  )
}

export default ProgressStrip
