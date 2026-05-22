import React from 'react'
import { Icon, Badge, Card, SectionTitle } from '../ui'
import { Generating } from './Generating'
import { RightRail, RailSection, PrevList, PrevStepHint } from './shared/RightRail'

// ── MiniWireframe ─────────────────────────────────────────────────────────────

interface MiniWireframeProps {
  dir?: any
}

export const MiniWireframe: React.FC<MiniWireframeProps> = ({ dir }) => {
  const wf = (dir && dir.wireframe) || {}
  const layout = wf.layout || 'list'
  const tabs = wf.tabs || ['综合', '最新', '价格']
  const hasSmartBanner = !!wf.hasSmartBanner
  const hasFAB = !!wf.hasFAB
  const rows = wf.rows || 3

  if (dir && dir.wireframeHTML) {
    return (
      <div style={{ width: 200, margin: '0 auto', background: '#1d1f25', borderRadius: 28, padding: 5, boxShadow: '0 16px 32px -12px rgba(0,0,0,0.4)' }}>
        <div style={{ width: '100%', height: 432, borderRadius: 23, background: '#fff', overflow: 'hidden', position: 'relative' }}>
          <iframe
            srcDoc={dir.wireframeHTML}
            sandbox=""
            title={`线框图 · 方向 ${dir.key}`}
            style={{
              width: 390, height: 844, border: 'none', display: 'block',
              transform: 'scale(0.4872)', transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: 200, margin: '0 auto', background: '#1d1f25', borderRadius: 28, padding: 5, boxShadow: '0 16px 32px -12px rgba(0,0,0,0.4)' }}>
      <div style={{ width: '100%', borderRadius: 23, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
        {/* status bar */}
        <div style={{ padding: '7px 14px 3px', display: 'flex', justifyContent: 'space-between', fontSize: 7.5, fontWeight: 500, color: '#999', flexShrink: 0 }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
            {[3, 5, 7, 9].map(h => <div key={h} style={{ width: 2.5, height: h, background: '#ccc', borderRadius: 1 }} />)}
            <div style={{ width: 13, height: 7, border: '1px solid #ccc', borderRadius: 2, marginLeft: 3, display: 'flex', padding: 1 }}><div style={{ flex: 1, background: '#ccc', borderRadius: 1 }} /></div>
          </div>
        </div>
        {/* search bar */}
        <div style={{ padding: '3px 8px 5px', flexShrink: 0 }}>
          <div style={{ height: 22, background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 11, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #bbb', flexShrink: 0 }} />
            <div style={{ flex: 1, height: 5, background: '#ddd', borderRadius: 2 }} />
          </div>
        </div>
        {/* filter tabs */}
        <div style={{ padding: '0 8px 5px', display: 'flex', gap: 3, flexShrink: 0 }}>
          {tabs.slice(0, 4).map((t: string, i: number) => (
            <div key={i} style={{ padding: '2px 7px', background: i === 0 ? '#1d1f25' : '#f5f5f5', color: i === 0 ? '#fff' : '#999', borderRadius: 9, fontSize: 6.5, fontWeight: i === 0 ? 600 : 400, border: i === 0 ? 'none' : '1px solid #e8e8e8', flexShrink: 0 }}>{t}</div>
          ))}
        </div>
        {/* smart banner */}
        {hasSmartBanner && (
          <div style={{ margin: '0 8px 5px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 5, padding: '5px 7px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: '#ccc' }} />
              <div style={{ height: 5, width: '50%', background: '#ccc', borderRadius: 2 }} />
            </div>
            <div style={{ height: 4, width: '70%', background: '#e0e0e0', borderRadius: 2 }} />
          </div>
        )}
        {/* content */}
        <div style={{ flex: 1, padding: '0 8px', overflow: 'hidden' }}>
          {layout === 'grid' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Array.from({ length: rows * 2 }).map((_, i) => (
                <div key={i} style={{ width: 'calc(50% - 2px)', background: '#f8f8f8', border: '1px solid #eee', borderRadius: 5 }}>
                  <div style={{ width: '100%', paddingTop: '70%', background: '#e8e8e8', borderRadius: '5px 5px 0 0' }} />
                  <div style={{ padding: '4px 5px' }}><div style={{ height: 4, background: '#ddd', borderRadius: 2, marginBottom: 3 }} /><div style={{ height: 5, width: '55%', background: '#bbb', borderRadius: 2 }} /></div>
                </div>
              ))}
            </div>
          ) : layout === 'compare' ? (
            <div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{ background: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: 5, padding: '6px 7px', marginBottom: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
                  <div style={{ width: 34, height: 38, background: '#e0e0e0', borderRadius: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}><div style={{ height: 4, background: '#ccc', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '50%', background: '#bbb', borderRadius: 2, marginBottom: 3 }} /><div style={{ display: 'flex', gap: 2 }}>{[28, 20, 16].map((w, j) => <div key={j} style={{ width: w, height: 7, background: '#e0e0e0', borderRadius: 6 }} />)}</div></div>
                  <div style={{ width: 16, height: 16, borderRadius: 999, border: '1.5px solid #bbb', flexShrink: 0 }} />
                </div>
              ))}
              <div style={{ background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 5, padding: 6, marginTop: 4 }}>
                <div style={{ height: 4, width: '40%', background: '#ccc', borderRadius: 2, marginBottom: 5 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {[0, 1].map(i => <div key={i} style={{ background: '#fff', borderRadius: 4, padding: 4 }}><div style={{ height: 6, width: '80%', background: '#bbb', borderRadius: 2, marginBottom: 3 }} />{[0, 1, 2].map(j => <div key={j} style={{ height: 3, background: '#e8e8e8', borderRadius: 1, marginBottom: 2 }} />)}</div>)}
                </div>
              </div>
            </div>
          ) : (
            Array.from({ length: rows }).map((_, i) => (
              <div key={i} style={{ background: '#f8f8f8', border: '1px solid #eee', borderRadius: 6, padding: '6px 7px', marginBottom: 4, display: 'flex', gap: 5 }}>
                <div style={{ width: 36, height: 40, background: '#e0e0e0', borderRadius: 4, flexShrink: 0 }} />
                <div style={{ flex: 1 }}><div style={{ height: 4, background: '#ccc', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 4, width: '80%', background: '#ddd', borderRadius: 2, marginBottom: 3 }} /><div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>{[28, 20, 16].map((w, j) => <div key={j} style={{ width: w, height: 7, background: '#e8e8e8', borderRadius: 6 }} />)}</div><div style={{ height: 6, width: '35%', background: '#bbb', borderRadius: 2 }} /></div>
              </div>
            ))
          )}
        </div>
        {/* FAB */}
        {hasFAB && <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', flexShrink: 0 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: '#1d1f25' }} /></div>}
        {/* nav bar */}
        <div style={{ height: 32, borderTop: '1px solid #eee', background: '#fafafa', display: 'flex', flexShrink: 0 }}>
          {['首页', '分类', '消息', '我的'].map((t, i) => (
            <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <div style={{ width: 10, height: 10, background: i === 0 ? '#1d1f25' : '#ddd', borderRadius: 2 }} />
              <span style={{ fontSize: 5.5, color: i === 0 ? '#1d1f25' : '#bbb' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step3 ─────────────────────────────────────────────────────────────────────

interface Step3Props {
  data4?: any
  chosen?: string
  onChoose: (key: string) => void
  running?: boolean
  genLabel?: string
}

export const Step3: React.FC<Step3Props> = ({ data4 = {}, chosen, onChoose, running, genLabel }) => {
  const costLabel: Record<string, string> = { low: '低成本', med: '中等成本', high: '高成本' }
  const costTone: Record<string, any> = { low: 'ok', med: 'warn', high: 'danger' }
  const directions = (data4 && data4.directions) || []
  const recommendation = (data4 && data4.recommendation) || {}

  if (!running && directions.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--tx-4)', fontSize: 13 }}>
        概念方向生成中，请稍候…
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'flex-start', position: 'relative' }}>
      {running && <Generating label={genLabel || '探索概念方向 + 生成对应线框图…'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
        <PrevStepHint label="基于 Step 02 P0/P1 机会点 · 3 个差异化策略 + 对应线框图" />

        {/* Uploaded reference page */}
        {window.DPData.uploadedImage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.08, textTransform: 'uppercase' }}>参考原始页面</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={window.DPData.uploadedImage}
                  alt="原始页面截图"
                  style={{ width: 160, borderRadius: 10, border: '1px solid var(--bd-1)', display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 7px', background: 'rgba(0,0,0,0.55)', borderRadius: 6, fontSize: 9, color: '#fff', fontWeight: 600, letterSpacing: 0.04 }}>原始</div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.7, paddingTop: 4 }}>
                以下三个概念方向均基于此页面进行重新设计。黑白稿呈现布局结构与交互逻辑，不包含视觉细节。
              </div>
            </div>
          </div>
        )}

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
              AI 推荐 · 方向 {recommendation.pick}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1.55 }}>
              {recommendation.reason}
            </div>
          </div>
        </div>

        {/* Direction cards — 3-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {directions.map((d: any) => {
            const isSelected = chosen === d.key
            return (
              <div key={d.key} onClick={() => onChoose(d.key)} style={{
                display: 'flex', flexDirection: 'column', gap: 14,
                padding: '18px 16px 20px',
                background: isSelected ? 'var(--ac-soft)' : 'var(--bg-1)',
                border: `1.5px solid ${isSelected ? 'var(--ac)' : 'var(--bd-1)'}`,
                borderRadius: 16, cursor: 'pointer', transition: 'all .15s',
                position: 'relative',
              }}>
                {/* Top badge */}
                {isSelected ? (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 22, height: 22, borderRadius: 999,
                    background: 'var(--ac)', color: 'var(--bg-0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name="check" size={13} /></div>
                ) : d.recommended ? (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    padding: '2px 7px', borderRadius: 999,
                    background: 'var(--ac)', color: 'var(--bg-0)',
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.04,
                  }} className="mono">RECOMMENDED</div>
                ) : null}

                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ac)', fontWeight: 700, letterSpacing: 0.06, marginBottom: 4 }}>方向 {d.key}</div>
                  <div className="display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--tx-1)', letterSpacing: -0.01, marginBottom: 2 }}>{d.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--tx-4)' }}>{d.subtitle}</div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.6 }}>{d.oneliner}</div>

                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.08, marginBottom: 5 }}>关键动作</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {(d.moves || []).map((m: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 5, fontSize: 11.5, color: 'var(--tx-2)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--ac)', flexShrink: 0 }}>›</span><span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  <Badge tone={costTone[d.cost]}>{costLabel[d.cost]}</Badge>
                  <Badge tone="outline" style={{ fontFamily: 'var(--mono)' }}>{d.impact}</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4 }}>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--tx-4)', letterSpacing: 0.1, marginBottom: 8, textTransform: 'uppercase' }}>黑白稿 · 方向 {d.key}</div>
                  <MiniWireframe dir={d} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Compare table */}
        <div>
          <SectionTitle eyebrow="COMPARE" title="横向对比" subtitle="把三个方向放在一张表上看" />
          <Card padded={false} style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd-1)' }}>
                  <th className="mono" style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10.5, color: 'var(--tx-4)', letterSpacing: 0.08, fontWeight: 500, width: 130 }}>维度</th>
                  {directions.map((d: any) => (
                    <th key={d.key} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--tx-1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 700 }}>{d.key}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.title}</span>
                        {d.key === recommendation.pick && <Badge tone="accent" style={{ height: 18, fontSize: 9 }}>推荐</Badge>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { k: '策略一句话', get: (d: any) => d.oneliner },
                  { k: '优势', get: (d: any) => d.advantage },
                  { k: '代价', get: (d: any) => d.tradeoff },
                  { k: '成本/风险', get: (d: any) => ({ low: '低', med: '中', high: '高' })[d.cost as string], badge: (d: any) => d.cost === 'low' ? 'ok' : d.cost === 'med' ? 'warn' : 'danger' },
                  { k: '预期影响', get: (d: any) => d.impact, mono: true },
                ].map((row, i, arr) => (
                  <tr key={row.k} style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--bd-1)' }}>
                    <td className="mono" style={{ padding: '12px 16px', color: 'var(--tx-4)', fontSize: 11, letterSpacing: 0.04 }}>{row.k}</td>
                    {directions.map((d: any) => (
                      <td key={d.key} style={{ padding: '12px 16px', verticalAlign: 'top', color: 'var(--tx-2)', fontFamily: row.mono ? 'var(--mono)' : 'inherit', fontSize: row.mono ? 12 : 12.5 }}>
                        {row.badge ? <Badge tone={row.badge(d)}>{row.get(d)}</Badge> : row.get(d)}
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
            {directions.map((d: any) => (
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
        <RailSection title="上一步关键产出" defaultOpen={false}>
          <PrevList items={[
            '用户决策模型 5 步：锁定→过滤→比对→校验→详情',
            'P0「卡片同屏五要素」决定卡片字段',
            'P1「保障标签前置」驱动方向 B 核心',
            'P1「比价对比抽屉」驱动方向 C 核心',
          ]} />
        </RailSection>
      </RightRail>
    </div>
  )
}

export default Step3
