import React from 'react'
import { Btn, Card, Icon } from '../ui'
import { Generating } from './Generating'
import { PrevStepHint } from './shared/RightRail'

// ── Dot ───────────────────────────────────────────────────────────────────────

interface DotProps {
  n: number
  hoverN: number | null
  setHover: (n: number | null) => void
  style?: React.CSSProperties
}

const Dot: React.FC<DotProps> = ({ n, hoverN, setHover, style }) => (
  <div
    data-dot={n}
    onMouseEnter={() => setHover(n)}
    onMouseLeave={() => setHover(null)}
    style={{
      position: 'absolute',
      width: 22, height: 22, borderRadius: 999,
      background: hoverN === n ? 'var(--ac)' : '#111',
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)',
      boxShadow: '0 0 0 2.5px #fff',
      zIndex: 4, cursor: 'pointer', transition: 'background .15s, transform .15s',
      transform: hoverN === n ? 'scale(1.15)' : 'scale(1)',
      ...(style || {}),
    }}>{n}</div>
)

// ── AnnotationNote ─────────────────────────────────────────────────────────────

interface AnnotationNoteProps {
  a: { n: number; note: string }
  hover: boolean
  setHover: (n: number | null) => void
  align: 'left' | 'right'
}

const AnnotationNote: React.FC<AnnotationNoteProps> = ({ a, hover, setHover, align }) => (
  <div
    data-note={a.n}
    onMouseEnter={() => setHover(a.n)}
    onMouseLeave={() => setHover(null)}
    style={{
      display: 'flex', gap: 10,
      flexDirection: align === 'right' ? 'row' : 'row-reverse',
      padding: '12px 14px',
      background: hover ? 'var(--ac-soft)' : 'var(--bg-2)',
      border: `1px solid ${hover ? 'var(--ac)' : 'var(--bd-1)'}`,
      borderRadius: 10,
      transition: 'all .15s',
      cursor: 'default',
    }}>
    <div style={{
      width: 24, height: 24, borderRadius: 999,
      background: hover ? 'var(--ac)' : 'var(--tx-1)', color: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
      boxShadow: '0 0 0 2px var(--bg-1)',
      flexShrink: 0,
    }}>{a.n}</div>
    <div style={{ flex: 1, fontSize: 12.5, color: 'var(--tx-2)', lineHeight: 1.55 }}>{a.note}</div>
  </div>
)

// ── WirePhone ─────────────────────────────────────────────────────────────────

interface WirePhoneProps {
  annotations: any[]
  hoverN: number | null
  setHover: (n: number | null) => void
}

const WirePhone: React.FC<WirePhoneProps> = ({ annotations, hoverN, setHover }) => {
  return (
    <div style={{
      width: 320, height: 680, margin: '0 auto',
      background: '#1d1f25',
      borderRadius: 42, padding: 8,
      boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)',
      position: 'relative',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 34,
        background: '#f5f5f7', overflow: 'hidden',
        position: 'relative', display: 'flex', flexDirection: 'column',
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          width: 88, height: 22, background: '#1d1f25', borderRadius: 999, zIndex: 10,
        }} />

        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 22px 0', fontSize: 10, fontWeight: 600, color: '#1d1f25', flexShrink: 0,
        }}>
          <span>9:41</span>
          <span style={{ letterSpacing: 1.5 }}>●●●</span>
        </div>

        {/* Search bar */}
        <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
          <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M8 1L2 7L8 13" stroke="#333" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div style={{ flex: 1, height: 32, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#aaa" strokeWidth="2"/><path d="m20 20-3.5-3.5" stroke="#aaa" strokeWidth="2" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 11.5, color: '#1d1f25', fontWeight: 600, flex: 1 }}>iPhone 15</span>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#888' }}>×</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: 16, flexShrink: 0 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ height: 1.5, background: '#555', borderRadius: 1 }} />)}
          </div>
          <Dot n={1} hoverN={hoverN} setHover={setHover} style={{ top: 6, right: 2 }} />
        </div>

        {/* Filter tabs */}
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 5, flexWrap: 'nowrap', flexShrink: 0, alignItems: 'center', position: 'relative' }}>
          <div style={{ flexShrink: 0, padding: '4px 11px', background: '#1d1f25', color: '#fff', borderRadius: 14, fontSize: 10, fontWeight: 700 }}>综合</div>
          <div style={{ flexShrink: 0, padding: '4px 8px', color: '#555', fontSize: 10 }}>价格</div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: 14, fontSize: 9, color: '#333' }}>
            9 成新及以上 <span style={{ color: '#aaa', fontSize: 9 }}>×</span>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: 14, fontSize: 9, color: '#333' }}>
            256G <span style={{ color: '#aaa', fontSize: 9 }}>×</span>
          </div>
          <div style={{ flexShrink: 0, padding: '4px 8px', color: '#555', fontSize: 10 }}>颜色</div>
          <Dot n={2} hoverN={hoverN} setHover={setHover} style={{ top: -6, right: 2 }} />
        </div>

        {/* Smart sort banner */}
        <div style={{ margin: '0 10px 6px', background: '#fff8f0', border: '1px solid #ffd9b0', borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, position: 'relative' }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: '#ffb74d', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>✦</div>
          <div style={{ flex: 1, fontSize: 9.5, color: '#5d4037', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700 }}>智能排序</span>
            <span style={{ color: '#999' }}> · 已按你的预算 </span>
            <span style={{ color: '#e53935', fontWeight: 700 }}>¥3,500—4,800</span>
            <span style={{ color: '#999' }}> 重新排序</span>
          </div>
          <div style={{ width: 26, height: 15, background: '#e53935', borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '1.5px 2px' }}>
            <div style={{ width: 11, height: 11, background: '#fff', borderRadius: 999 }} />
          </div>
          <Dot n={3} hoverN={hoverN} setHover={setHover} style={{ top: -8, right: -8 }} />
        </div>

        {/* Results count row */}
        <div style={{ padding: '0 12px 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: '#999' }}>为你找到 <strong style={{ color: '#1d1f25' }}>1,283</strong> 件商品</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 9, color: '#333', fontWeight: 600 }}>价格 ↑↓</span>
            <span style={{ fontSize: 9, color: '#333', fontWeight: 600 }}>筛选 ▽</span>
          </div>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0 10px 8px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {/* Card 1 — featured */}
          <div style={{ background: '#fff', border: '1.5px solid #ffcdd2', borderRadius: 10, padding: '10px', display: 'flex', gap: 8, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, background: '#e53935', color: '#fff', fontSize: 7.5, fontWeight: 700, padding: '2px 8px', borderBottomRightRadius: 6 }}>官方验机精选</div>
            <div style={{ width: 74, height: 80, background: '#e8eaec', borderRadius: 7, flexShrink: 0, marginTop: 12, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 4, right: 3, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 7, padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>8 图</div>
              <Dot n={5} hoverN={hoverN} setHover={setHover} style={{ top: -8, left: -8 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, paddingTop: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1d1f25', lineHeight: 1.4 }}>iPhone 15 / 256G / 蓝色 / 国行 / 9.8 成新</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                {['9.8 成新', '256G', '蓝色', '国行双卡'].map(t => (
                  <div key={t} style={{ padding: '1px 5px', background: '#f2f2f2', borderRadius: 3, fontSize: 8, color: '#555' }}>{t}</div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#e53935' }}>¥4,280</span>
                <span style={{ fontSize: 9, color: '#ccc', textDecoration: 'line-through' }}>¥5,999</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                <div style={{ padding: '1px 5px', background: '#fffbf0', color: '#d97706', border: '1px solid #fde68a', borderRadius: 3, fontSize: 7.5 }}>✓ 已验机</div>
                <div style={{ padding: '1px 5px', background: '#f0faf3', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 3, fontSize: 7.5 }}>7 天无理由</div>
                <div style={{ padding: '1px 5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 3, fontSize: 7.5 }}>一年质保</div>
                <div style={{ padding: '1px 5px', background: '#fdf4ff', color: '#7c3aed', border: '1px solid #e9d5ff', borderRadius: 3, fontSize: 7.5 }}>极速发货</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 8, color: '#999' }}>官方自营</span>
                <div style={{ display: 'flex', gap: 1.5 }}>
                  {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: 999, background: '#e53935' }} />)}
                </div>
                <span style={{ fontSize: 8, color: '#aaa' }}>信用</span>
                <span style={{ fontSize: 8, color: '#bbb', marginLeft: 'auto' }}>已售 348</span>
              </div>
            </div>
            <Dot n={4} hoverN={hoverN} setHover={setHover} style={{ top: -8, right: -8 }} />
          </div>

          {/* Card 2 */}
          <div style={{ background: '#fff', border: '1px solid #e8eaec', borderRadius: 10, padding: '10px', display: 'flex', gap: 8, position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 74, height: 78, background: '#e8eaec', borderRadius: 7, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#1d1f25', lineHeight: 1.4 }}>iPhone 15 / 256G / 浅金色 / 美版有锁</div>
              <div style={{ display: 'flex', gap: 2.5 }}>
                {['9.5 成新', '256G', '浅金', '美版'].map(t => (
                  <div key={t} style={{ padding: '1px 5px', background: '#f2f2f2', borderRadius: 3, fontSize: 8, color: '#555' }}>{t}</div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#e53935' }}>¥3,860</span>
                <span style={{ fontSize: 9, color: '#ccc', textDecoration: 'line-through' }}>¥5,999</span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ padding: '1px 5px', background: '#fffbf0', color: '#d97706', border: '1px solid #fde68a', borderRadius: 3, fontSize: 7.5 }}>✓ 已验机</div>
                <div style={{ padding: '1px 5px', background: '#f0faf3', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 3, fontSize: 7.5 }}>7 天无理由</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 8, color: '#999' }}>良品个人卖家</span>
                <div style={{ display: 'flex', gap: 1.5 }}>
                  {[0, 1, 2, 3].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: 999, background: '#e53935' }} />)}
                  <div style={{ width: 5, height: 5, borderRadius: 999, border: '1px solid #ddd', background: '#fff' }} />
                </div>
                <span style={{ fontSize: 8, color: '#bbb', marginLeft: 'auto' }}>已售 27</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <div style={{ position: 'absolute', bottom: 58, right: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: '#1d1f25', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700, gap: 2, boxShadow: '0 6px 16px -4px rgba(0,0,0,0.4)', position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="9" height="18" rx="2" stroke="white" strokeWidth="2"/><rect x="12" y="7" width="9" height="14" rx="2" stroke="white" strokeWidth="2"/></svg>
            <span>对比</span>
            <Dot n={6} hoverN={hoverN} setHover={setHover} style={{ top: -8, right: -8 }} />
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ height: 50, borderTop: '1px solid #e8eaec', background: '#fff', display: 'flex', flexShrink: 0 }}>
          {['首页', '分类', '发现', '消息', '我的'].map((t, i) => (
            <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <div style={{ width: 18, height: 18, background: i === 0 ? '#1d1f25' : '#d0d0d0', borderRadius: 4 }} />
              <span style={{ fontSize: 9, color: i === 0 ? '#1d1f25' : '#aaa', fontWeight: i === 0 ? 700 : 400 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step5 ─────────────────────────────────────────────────────────────────────

interface Step5Props {
  data: any
  running?: boolean
}

export const Step5: React.FC<Step5Props> = ({ data, running }) => {
  const [hoverN, setHoverN] = React.useState<number | null>(null)
  const wireRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [lines, setLines] = React.useState<any[]>([])

  React.useLayoutEffect(() => {
    const compute = () => {
      if (!wireRef.current || !containerRef.current) return
      const containerBox = containerRef.current.getBoundingClientRect()
      const newLines: any[] = []
      data.annotations.forEach((a: any) => {
        const dot = wireRef.current!.querySelector(`[data-dot="${a.n}"]`)
        const note = containerRef.current!.querySelector(`[data-note="${a.n}"]`)
        if (!dot || !note) return
        const dotBox = dot.getBoundingClientRect()
        const noteBox = note.getBoundingClientRect()
        const x1 = dotBox.left + dotBox.width / 2 - containerBox.left
        const y1 = dotBox.top + dotBox.height / 2 - containerBox.top
        const x2 = noteBox.left - containerBox.left
        const y2 = noteBox.top + 14 - containerBox.top
        newLines.push({ n: a.n, x1, y1, x2, y2 })
      })
      setLines(newLines)
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', compute)
    return () => { ro.disconnect(); window.removeEventListener('resize', compute) }
  }, [data.annotations])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      {running && <Generating label="重绘线框 + 标注…" />}

      <PrevStepHint label="基于 Step 04 方向 B 「能力增强」生成" />

      <Card style={{ background: 'linear-gradient(135deg, var(--bg-1), var(--bg-0))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--bg-2)', border: '1px dashed var(--bd-2)', color: 'var(--tx-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><Icon name="phone" size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{data.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1.55 }}>{data.summary}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn size="sm" variant="ghost" icon="phone" active>Mobile</Btn>
            <Btn size="sm" variant="ghost">Tablet</Btn>
            <Btn size="sm" variant="ghost">Desktop</Btn>
          </div>
        </div>
      </Card>

      {/* Wire + annotations container */}
      <div ref={containerRef} style={{
        position: 'relative',
        background: 'var(--bg-1)',
        border: '1px solid var(--bd-1)',
        borderRadius: 14,
        padding: '40px 24px',
        minHeight: 760,
        overflow: 'visible',
      }}>
        {/* Leader lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
          {lines.map(l => {
            const active = hoverN === l.n
            const midX = (l.x1 + l.x2) / 2
            return (
              <g key={l.n}>
                <path
                  d={`M ${l.x1} ${l.y1} L ${midX} ${l.y1} L ${midX} ${l.y2} L ${l.x2} ${l.y2}`}
                  fill="none"
                  stroke={active ? 'var(--ac)' : 'var(--bd-2)'}
                  strokeWidth={active ? 1.6 : 1}
                  strokeDasharray="3 4"
                />
                <circle cx={l.x2} cy={l.y2} r={2} fill={active ? 'var(--ac)' : 'var(--tx-4)'} />
              </g>
            )
          })}
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 1fr', gap: 20, alignItems: 'flex-start' }}>
          {/* Left notes (1, 2, 3) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 28 }}>
            {data.annotations.filter((a: any) => a.n <= 3).map((a: any) => (
              <AnnotationNote key={a.n} a={a} hover={hoverN === a.n} setHover={setHoverN} align="left" />
            ))}
          </div>

          {/* Phone frame */}
          <div ref={wireRef}>
            <WirePhone annotations={data.annotations} hoverN={hoverN} setHover={setHoverN} />
          </div>

          {/* Right notes (4, 5, 6) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 28 }}>
            {data.annotations.filter((a: any) => a.n > 3).map((a: any) => (
              <AnnotationNote key={a.n} a={a} hover={hoverN === a.n} setHover={setHoverN} align="right" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step5
