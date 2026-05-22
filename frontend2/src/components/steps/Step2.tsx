import React from 'react'
import { Icon, Badge, Card, SectionTitle } from '../ui'
import { Generating } from './Generating'
import { RightRail, RailSection, RailRow, PrevList } from './shared/RightRail'
import { ArtifactLink } from './shared/ArtifactLink'
import { triggerDownload, genStep2MD } from '../../utils/download'

interface Step2Props {
  data?: any
  running?: boolean
  genLabel?: string
}

export const Step2: React.FC<Step2Props> = ({ data = {}, running, genLabel }) => {
  const decisionModel = data.decisionModel || []
  const tensions = data.tensions || []
  const judgements = data.judgements || []
  const opportunities = data.opportunities || []
  const principles = data.principles || []

  if (!running && !data.diagnosis) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--tx-4)', fontSize: 13 }}>
        设计分析生成中，请稍候…
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'flex-start', position: 'relative' }}>
      {running && <Generating label={genLabel || '正在做设计诊断…'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 999,
          background: 'var(--bg-2)', border: '1px solid var(--bd-1)',
          fontSize: 11.5, color: 'var(--tx-3)', alignSelf: 'flex-start',
        }}>
          <Icon name="chevron-left" size={11} style={{ color: 'var(--ac)' }} />
          <span>基于 Step 01「竞品分析」5 项设计输入</span>
        </div>

        {/* Diagnosis hero */}
        <Card style={{ background: 'linear-gradient(135deg, var(--ac-soft), transparent)', borderColor: 'var(--ac-line)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ac)', letterSpacing: 0.1, marginBottom: 10 }}>
            ONE-SENTENCE DIAGNOSIS · 一句话诊断
          </div>
          <div className="serif" style={{ fontSize: 22, lineHeight: 1.5, color: 'var(--tx-1)', fontWeight: 500, letterSpacing: -0.01 }}>
            「{data.diagnosis}」
          </div>
        </Card>

        {/* Decision model */}
        <div>
          <SectionTitle eyebrow="DECISION MODEL" title="用户决策模型" subtitle="iPhone 15 二手购买者从进入到下单的心智路径" />
          <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
            {decisionModel.map((m: any, i: number) => (
              <React.Fragment key={i}>
                <div style={{
                  flex: 1, padding: '16px 14px',
                  background: 'var(--bg-1)', border: '1px solid var(--bd-1)',
                  borderRadius: 12, position: 'relative',
                  minWidth: 0,
                }}>
                  <div className="mono" style={{ fontSize: 9.5, color: 'var(--ac)', letterSpacing: 0.08, marginBottom: 8 }}>
                    0{i + 1} → {i + 2 > decisionModel.length ? 'END' : '0' + (i + 2)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--tx-3)', lineHeight: 1.5 }}>{m.text}</div>
                </div>
                {i < decisionModel.length - 1 && (
                  <div style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx-4)' }}>
                    <Icon name="chevron-right" size={14} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tensions */}
        <div>
          <SectionTitle eyebrow="TENSIONS" title="核心体验矛盾" subtitle={`${tensions.length} 组关键张力 — 这些是后续设计的真正命题`} />
          <Card padded={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd-1)' }}>
                  {['矛盾', '表现', '设计含义'].map(h => (
                    <th key={h} className="mono" style={{
                      textAlign: 'left', padding: '12px 16px',
                      fontSize: 10.5, fontWeight: 500, color: 'var(--tx-4)', letterSpacing: 0.08,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tensions.map((t: any, i: number) => (
                  <tr key={i} style={{ borderBottom: i === tensions.length - 1 ? 'none' : '1px solid var(--bd-1)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--tx-1)', width: 200 }}>{t.name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--tx-2)' }}>{t.expr}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--ac)' }}>{t.design}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Key judgements */}
        <div>
          <SectionTitle eyebrow="KEY JUDGEMENTS" title="关键设计判断" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {judgements.map((j: string, i: number) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                background: 'var(--bg-1)', border: '1px solid var(--bd-1)', borderRadius: 10,
                borderLeft: '3px solid var(--ac)',
              }}>
                <Icon name="target" size={16} style={{ color: 'var(--ac)', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13.5, color: 'var(--tx-1)', lineHeight: 1.55, fontWeight: 500 }}>{j}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div>
          <SectionTitle eyebrow="OPPORTUNITIES" title="机会优先级" subtitle="P0/P1/P2 — 决定哪些进入 Step 3 概念方向" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opportunities.map((o: any, i: number) => {
              const tones: Record<string, any> = { P0: 'danger', P1: 'warn', P2: 'default' }
              return (
                <Card key={i} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <Badge tone={tones[o.p]} style={{ height: 24, fontSize: 11, fontWeight: 700, padding: '0 10px', flexShrink: 0 }}>{o.p}</Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 4 }}>{o.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1.55 }}>{o.why}</div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 11.5, color: 'var(--tx-4)', fontFamily: 'var(--mono)' }}>{o.impact}</div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Principles */}
        <div>
          <SectionTitle eyebrow="DESIGN PRINCIPLES" title="设计原则" subtitle="用于约束 Step 3/4 的具体输出" />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {principles.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className="mono" style={{
                    fontSize: 11, color: 'var(--ac)', fontWeight: 700,
                    minWidth: 24, marginTop: 1,
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="serif" style={{ fontSize: 14.5, color: 'var(--tx-1)', lineHeight: 1.55 }}>{p}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Supporting */}
        <details style={{ background: 'var(--bg-1)', border: '1px solid var(--bd-1)', borderRadius: 12, padding: 0 }}>
          <summary style={{
            padding: '14px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--tx-2)',
            display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none',
          }}>
            <Icon name="chevron-right" size={14} />
            支撑分析（Nielsen 启发式 + JTBD）— 默认收起
          </summary>
          <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--tx-4)', letterSpacing: 0.08, marginBottom: 10 }}>NIELSEN 摘要</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bd-1)', color: 'var(--tx-4)' }}>
                    {['原则', '相关问题', '严重程度', '设计启发'].map(h => (
                      <th key={h} className="mono" style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10.5, fontWeight: 500, letterSpacing: 0.06 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.nielsen || []).map((n: any, i: number) => (
                    <tr key={i} style={{ borderBottom: i === (data.nielsen || []).length - 1 ? 'none' : '1px solid var(--bd-1)' }}>
                      <td style={{ padding: '10px', color: 'var(--tx-1)', fontWeight: 500 }}>{n.rule}</td>
                      <td style={{ padding: '10px', color: 'var(--tx-3)' }}>{n.issue}</td>
                      <td style={{ padding: '10px' }}>
                        <Badge tone={n.level === '高' ? 'danger' : n.level === '中' ? 'warn' : 'default'}>{n.level}</Badge>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--ac)' }}>{n.insight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--tx-4)', letterSpacing: 0.08, marginBottom: 10 }}>JTBD 摘要</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { k: '核心 Job', v: (data.jtbd || {}).core, tone: 'var(--ac)' },
                  { k: '情感 Job', v: (data.jtbd || {}).emotion, tone: 'var(--warn)' },
                  { k: '社交 Job', v: (data.jtbd || {}).social, tone: 'var(--ok)' },
                ].map((j, i) => (
                  <Card key={i} style={{ padding: 14 }}>
                    <div className="mono" style={{ fontSize: 10, color: j.tone, letterSpacing: 0.08, marginBottom: 6 }}>{j.k}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--tx-2)', lineHeight: 1.55 }}>{j.v}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Right rail */}
      <RightRail>
        <RailSection title="上一步关键产出" defaultOpen={false}>
          <PrevList items={[
            '5 项分析焦点已固定',
            '4 家竞品中提炼出 4 类「可借鉴 ↔ 不照搬」对比',
            '5 项设计输入（Step 2/3/4 共用）',
          ]} />
        </RailSection>
        <RailSection title="本步骤产物" defaultOpen={false}>
          <ArtifactLink icon="doc" label="02-设计分析.md" onClick={() => triggerDownload(genStep2MD(), '02-设计分析.md', 'text/markdown')} />
        </RailSection>
        <RailSection title="影响后续" defaultOpen={false}>
          <RailRow label="Step 3" value="P0/P1 机会转化为概念方向 + 线框" />
          <RailRow label="Step 4" value="设计原则约束高保真输出" />
          <RailRow label="Step 5" value="交付摘要归档所有产物" />
        </RailSection>
      </RightRail>
    </div>
  )
}

export default Step2
