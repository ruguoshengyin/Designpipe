import React from 'react'
import { Icon, Badge, Card, SectionTitle } from '../ui'
import { Generating } from './Generating'
import { RightRail, RailSection, PrevStepHint } from './shared/RightRail'

// ── DirectionCard ─────────────────────────────────────────────────────────────

interface DirectionCardProps {
  d: any
  selected: boolean
  onSelect: () => void
}

export const DirectionCard: React.FC<DirectionCardProps> = ({ d, selected, onSelect }) => {
  const costMap: Record<string, { label: string; tone: any }> = {
    low: { label: '低成本', tone: 'ok' },
    med: { label: '中等成本', tone: 'warn' },
    high: { label: '高成本', tone: 'danger' },
  }
  const c = costMap[d.cost] || costMap.med
  return (
    <div onClick={onSelect} style={{
      position: 'relative',
      background: selected ? 'var(--ac-soft)' : 'var(--bg-1)',
      border: `1.5px solid ${selected ? 'var(--ac)' : 'var(--bd-1)'}`,
      borderRadius: 14, padding: 18,
      cursor: 'pointer', transition: 'all .15s',
      display: 'flex', flexDirection: 'column', gap: 12,
      minHeight: 360,
    }}>
      {d.recommended && !selected && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          padding: '3px 8px', borderRadius: 999,
          background: 'var(--ac)', color: 'var(--bg-0)',
          fontSize: 10, fontWeight: 700, letterSpacing: 0.04,
        }} className="mono">RECOMMENDED</div>
      )}
      {selected && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 24, height: 24, borderRadius: 999,
          background: 'var(--ac)', color: 'var(--bg-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="check" size={14} /></div>
      )}

      <div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 700, letterSpacing: 0.06, marginBottom: 4 }}>
          方向 {d.key}
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx-1)', letterSpacing: -0.01 }}>
          {d.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--tx-4)', marginTop: 2 }}>{d.subtitle}</div>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--tx-2)', lineHeight: 1.6, flex: 1 }}>
        {d.oneliner}
      </div>

      <div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.08, marginBottom: 6 }}>关键动作</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(d.moves || []).map((m: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.55 }}>
              <span style={{ color: 'var(--ac)' }}>›</span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: '1px solid var(--bd-1)' }}>
        <Badge tone={c.tone}>{c.label}</Badge>
        <Badge tone="outline" style={{ fontFamily: 'var(--mono)' }}>{d.impact}</Badge>
      </div>
    </div>
  )
}

// ── Step4 ─────────────────────────────────────────────────────────────────────

interface Step4Props {
  data: any
  chosen?: string
  onChoose: (key: string) => void
  running?: boolean
}

export const Step4: React.FC<Step4Props> = ({ data, chosen, onChoose, running }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'flex-start', position: 'relative' }}>
      {running && <Generating label="探索新的概念方向…" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
        <PrevStepHint label="基于 Step 02 P0/P1 机会点 · 3 个差异化策略方向" />

        {/* Recommendation banner */}
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: 'linear-gradient(135deg, var(--ac-soft), transparent 60%)',
          border: '1px solid var(--ac-line)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--ac)', color: 'var(--bg-0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="sparkles" size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--tx-1)', fontWeight: 600, marginBottom: 2 }}>
              AI 推荐 · 方向 {data.recommendation?.pick}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1.55 }}>
              {data.recommendation?.reason}
            </div>
          </div>
        </div>

        {/* Direction cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {(data.directions || []).map((d: any) => (
            <DirectionCard key={d.key} d={d} selected={chosen === d.key} onSelect={() => onChoose(d.key)} />
          ))}
        </div>

        {/* Compare table */}
        <div>
          <SectionTitle eyebrow="COMPARE" title="横向对比" subtitle="把三个方向放在一张表上看" />
          <Card padded={false} style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd-1)' }}>
                  <th className="mono" style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10.5, color: 'var(--tx-4)', letterSpacing: 0.08, fontWeight: 500, width: 130 }}>维度</th>
                  {(data.directions || []).map((d: any) => (
                    <th key={d.key} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--tx-1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 700 }}>{d.key}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.title}</span>
                        {d.key === data.recommendation?.pick && <Badge tone="accent" style={{ height: 18, fontSize: 9 }}>推荐</Badge>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { k: '策略一句话', get: (d: any) => d.oneliner },
                  { k: '优势', get: (d: any) => d.advantage, tone: 'ok' },
                  { k: '代价', get: (d: any) => d.tradeoff, tone: 'warn' },
                  { k: '成本/风险', get: (d: any) => ({ low: '低', med: '中', high: '高' })[d.cost as string], badge: (d: any) => d.cost === 'low' ? 'ok' : d.cost === 'med' ? 'warn' : 'danger' },
                  { k: '预期影响', get: (d: any) => d.impact, mono: true },
                  { k: '对应机会', get: (d: any) => d.cite, color: 'var(--tx-3)' },
                ].map((row, i, arr) => (
                  <tr key={row.k} style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--bd-1)' }}>
                    <td className="mono" style={{ padding: '12px 16px', color: 'var(--tx-4)', fontSize: 11, letterSpacing: 0.04 }}>{row.k}</td>
                    {(data.directions || []).map((d: any) => (
                      <td key={d.key} style={{ padding: '12px 16px', verticalAlign: 'top', color: (row as any).color || 'var(--tx-2)', fontFamily: row.mono ? 'var(--mono)' : 'inherit', fontSize: row.mono ? 12 : 12.5 }}>
                        {(row as any).badge ? <Badge tone={(row as any).badge(d)}>{row.get(d)}</Badge> : row.get(d)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      {/* Right rail */}
      <RightRail>
        <RailSection title="🚩 需要你的选择">
          <div style={{ fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1.6, marginBottom: 12 }}>
            Step 3 是流程中的<b style={{ color: 'var(--tx-1)' }}>人审节点</b>。请选定一个方向再继续，后续 Step 4/5 将基于此方向生成。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(data.directions || []).map((d: any) => (
              <button key={d.key} onClick={() => onChoose(d.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: chosen === d.key ? 'var(--ac-soft)' : 'var(--bg-2)',
                border: `1px solid ${chosen === d.key ? 'var(--ac)' : 'var(--bd-1)'}`,
                borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: chosen === d.key ? 'var(--ac)' : 'transparent',
                  border: `2px solid ${chosen === d.key ? 'var(--ac)' : 'var(--bd-2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg-0)', flexShrink: 0,
                }}>{chosen === d.key && <Icon name="check" size={12} />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx-1)' }}>方向 {d.key} · {d.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-4)' }}>{d.subtitle}</div>
                </div>
              </button>
            ))}
            <button onClick={() => onChoose('BLEND')} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: chosen === 'BLEND' ? 'var(--ac-soft)' : 'transparent',
              border: `1px dashed ${chosen === 'BLEND' ? 'var(--ac)' : 'var(--bd-1)'}`,
              borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: 'var(--tx-3)', fontFamily: 'inherit',
              fontSize: 12,
            }}>
              <Icon name="git-branch" size={14} />
              混合 / 分叉为多个方向继续
            </button>
          </div>
        </RailSection>
      </RightRail>
    </div>
  )
}

export default Step4
