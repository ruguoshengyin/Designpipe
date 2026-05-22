import React from 'react'
import { Icon, Badge, Card, SectionTitle } from '../ui'
import { Generating } from './Generating'
import { RightRail, RailSection, RailRow, PrevStepHint, PrevList } from './shared/RightRail'
import { ArtifactLink } from './shared/ArtifactLink'
import { triggerDownload, genStep1MD, genStep1CSV } from '../../utils/download'

interface Step1Props {
  data: any
  project: any
  running?: boolean
  genLabel?: string
}

export const Step1: React.FC<Step1Props> = ({ data, project, running, genLabel }) => {
  const [hoverRow, setHoverRow] = React.useState<number | null>(null)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'flex-start', position: 'relative' }}>
      {running && <Generating label={genLabel || '重新分析竞品中…'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <PrevStepHint label="本步是工作流起点 · 项目设定来自 Brief" />

        {/* Objective */}
        <Card>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ac)', letterSpacing: 0.08, marginBottom: 8 }}>本次分析目标</div>
          <div style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--tx-1)' }}>{data.objective}</div>
        </Card>

        {/* Focus */}
        <div>
          <SectionTitle eyebrow="ANALYSIS FOCUS" title="分析焦点" subtitle="围绕当前页面/功能提炼设计输入" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(data.focus || []).map((f: string, i: number) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '12px 14px',
                background: 'var(--bg-1)', border: '1px solid var(--bd-1)', borderRadius: 10,
              }}>
                <div className="mono" style={{
                  fontSize: 11, color: 'var(--ac)', fontWeight: 600, flexShrink: 0,
                }}>F{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--tx-2)' }}>{f}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor table */}
        <div>
          <SectionTitle eyebrow="COMPETITORS" title="竞品信息提炼" subtitle={`对比 ${(data.competitors || []).length} 家竞品 · 仅保留对后续步骤有影响的观察`} />
          <Card padded={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd-1)' }}>
                  {['竞品', '关键观察', '可借鉴', '不照搬', '对后续影响'].map((h, i) => (
                    <th key={h} className="mono" style={{
                      textAlign: 'left', padding: '12px 14px',
                      fontSize: 10.5, fontWeight: 500, color: 'var(--tx-4)',
                      letterSpacing: 0.08, width: i === 0 ? 140 : 'auto',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.competitors || []).map((c: any, i: number) => (
                  <tr key={c.name}
                    onMouseEnter={() => setHoverRow(i)}
                    onMouseLeave={() => setHoverRow(null)}
                    style={{
                      borderBottom: i === data.competitors.length - 1 ? 'none' : '1px solid var(--bd-1)',
                      background: hoverRow === i ? 'var(--bg-2)' : 'transparent',
                      transition: 'background .15s',
                    }}>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600, color: 'var(--tx-1)', marginBottom: 4 }}>{c.name}</div>
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="mono" style={{
                        fontSize: 10.5, color: 'var(--ac)', textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        来源 <Icon name="external" size={10} />
                      </a>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', color: 'var(--tx-2)', lineHeight: 1.55 }}>{c.observation}</td>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <Badge tone="ok">{c.usable}</Badge>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <Badge tone="warn">{c.avoid}</Badge>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', color: 'var(--tx-3)', fontSize: 12, lineHeight: 1.5 }}>{c.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Design inputs */}
        <div>
          <SectionTitle eyebrow="DESIGN INPUTS" title="设计输入清单" subtitle="供后续 Step 2–5 复用" />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(data.inputs || []).map((inp: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: 'var(--ac-soft)', color: 'var(--ac)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                  }}>↗</div>
                  <div style={{ fontSize: 13.5, color: 'var(--tx-2)', lineHeight: 1.6 }}>{inp}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky right rail */}
      <RightRail>
        <RailSection title="Brief" defaultOpen={true}>
          <RailRow label="产品" value={project.product} />
          <RailRow label="目标用户" value={project.targetUser} />
          <RailRow label="场景" value={project.scenario} />
          <RailRow label="风格" value={project.style} />
        </RailSection>
        <RailSection title="AI 用了哪些来源">
          {(data.competitors || []).map((c: any) => {
            let hostname = ''
            try { hostname = new URL(c.url).hostname.replace('www.', '') } catch {}
            return (
              <a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
                fontSize: 12, color: 'var(--tx-2)', textDecoration: 'none',
              }}>
                <Icon name="external" size={11} style={{ color: 'var(--tx-4)' }} />
                <span style={{ flex: 1 }}>{c.name}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--tx-4)' }}>{hostname}</span>
              </a>
            )
          })}
        </RailSection>
        <RailSection title="本步骤产物" defaultOpen={false}>
          <ArtifactLink icon="doc" label="01-竞品分析.md" onClick={() => triggerDownload(genStep1MD(), '01-竞品分析.md', 'text/markdown')} />
          <ArtifactLink icon="doc" label="01-竞品分析.csv" onClick={() => triggerDownload(genStep1CSV(), '01-竞品分析.csv', 'text/csv')} />
        </RailSection>
      </RightRail>
    </div>
  )
}

export default Step1
