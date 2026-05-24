import React from 'react'
import { Btn, Chip, Card, Icon } from '../ui'
import { Generating } from './Generating'
import { PrevStepHint } from './shared/RightRail'
import { triggerDownload, genStep6HTML } from '../../utils/download'

// ── ZZHiFiPage ────────────────────────────────────────────────────────────────

interface ZZHiFiPageProps {
  data?: any
}

export const ZZHiFiPage: React.FC<ZZHiFiPageProps> = ({ data }) => {
  const [activeSort, setActiveSort] = React.useState(0)
  const [activeChips, setActiveChips] = React.useState<Record<number, boolean>>({})
  const [compareItems, setCompareItems] = React.useState<Set<number>>(new Set())

  const ZZ = {
    brand: '#FF0F27', brandBg: '#FFF2F2',
    fg1: '#111111', fg2: '#666666', fg3: '#999999', fgDim: '#BBBBBB',
    divider: '#F0F0F0', stroke: '#D8D8D8',
    bgPage: '#F8F8F8', bgCard: '#FFFFFF',
    warning: '#FFA628', warningBg: '#FFFAED',
    teal: '#2E6E89', orange: '#EE8B57',
  }

  const d = data || {}
  const sortTabs = d.sortTabs || ['综合', '价格', '型号', '筛选']
  const filterChips = d.filterChips || ['9成新+', '256G', '苹果', '¥3k-5k', '12月质保', '在仓直发']
  const searchKeyword = d.searchKeyword || '搜索商品'
  const smartBanner = d.smartBanner || { show: true, text: '智能排序', subtext: '已根据您的偏好优先展示' }

  const tagStyleMap: Record<string, any> = {
    '官方已验机': { border: '#111111' },
    '已验机': { border: '#111111' },
    '7天无理由': { border: '#111111' },
    '一年质保': { border: '#2E6E89', color: '#2E6E89' },
    '在仓直发': { border: '#FF0F27', color: '#FF0F27' },
  }
  const getTagStyle = (label: string) => tagStyleMap[label] || { border: '#111111' }

  const rawProducts = d.products || [
    { title: '苹果 iPhone 15 256GB 蓝色', price: '4,280', condition: '99新', conditionNote: '外观无划痕 功能完好', tags: ['官方已验机', '7天无理由', '一年质保'], promo: '促销' },
    { title: 'iPhone 15 256G 金色 原装配件', price: '3,860', condition: '95新', conditionNote: '外观良好 功能正常', tags: ['已验机', '7天无理由'], promo: '次日达' },
    { title: 'iPhone 15 128G 黑色', price: '3,500', condition: '9成新', conditionNote: '有轻微划痕 功能正常', tags: ['已验机', '在仓直发'], promo: null },
    { title: 'iPhone 15 128G 白色 全套包装', price: '3,480', condition: '9成新', conditionNote: '外观良好 功能正常', tags: ['7天无理由'], promo: null },
  ]
  const products = rawProducts.map((p: any, id: number) => ({
    id,
    title: p.title,
    condition: p.condition,
    conditionExtra: p.conditionNote || '',
    price: p.price,
    sales: `月售${30 + id * 15}`,
    tags: (p.tags || []).map((label: string) => ({ label, ...getTagStyle(label) })),
    promo: p.promo || null,
  }))

  const conditionColor = (c: string) => c === '99新' ? ZZ.teal : ZZ.orange
  const toggleCompare = (id: number) => {
    const next = new Set(compareItems)
    if (next.has(id)) next.delete(id); else if (next.size < 3) next.add(id)
    setCompareItems(next)
  }

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: "'PingFang SC', -apple-system, sans-serif", background: ZZ.bgPage, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Status bar */}
      <div style={{ height: 44, background: ZZ.bgCard, display: 'flex', alignItems: 'center', padding: '0 18px 0 20px', flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: ZZ.fg1, flex: 1 }}>9:41</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="0" y="4" width="3" height="8" rx="0.5" fill={ZZ.fg1}/>
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill={ZZ.fg1}/>
            <rect x="9" y="1" width="3" height="11" rx="0.5" fill={ZZ.fg1}/>
          </svg>
          <div style={{ width: 24, height: 12, border: `1px solid ${ZZ.fg1}`, borderRadius: 3, padding: '1px 1px 1px 1px', display: 'flex', gap: 1 }}>
            <div style={{ width: '80%', background: ZZ.fg1, borderRadius: 1.5 }} />
            <div style={{ width: 2, height: 5, background: ZZ.fg1, borderRadius: 999, alignSelf: 'center' }} />
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ height: 52, background: ZZ.bgCard, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M15 18L9 12L15 6" stroke={ZZ.fg1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{ flex: 1, height: 36, border: `1px solid ${ZZ.fg1}`, borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke={ZZ.fg3} strokeWidth="2"/>
            <path d="m20 20-3.5-3.5" stroke={ZZ.fg3} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, color: ZZ.fg1, fontWeight: 400 }}>{searchKeyword}</span>
        </div>
        <span style={{ fontSize: 13, color: ZZ.brand, fontWeight: 400, flexShrink: 0 }}>搜索</span>
      </div>

      {/* Sort tabs */}
      <div style={{ height: 36, background: ZZ.bgCard, display: 'flex', alignItems: 'center', padding: '0 28px', justifyContent: 'space-between', borderBottom: `0.5px solid ${ZZ.divider}`, flexShrink: 0 }}>
        {sortTabs.map((tab: string, i: number) => (
          <button key={tab} onClick={() => setActiveSort(i)} style={{ border: 'none', background: 'none', padding: '4px 8px', fontSize: 12, fontWeight: 300, color: activeSort === i ? ZZ.brand : ZZ.fg2, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 2 }}>
            {tab}<span style={{ fontSize: 8 }}>{i === 0 ? '▼' : i === 1 ? '↕' : ''}</span>
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ height: 44, background: ZZ.bgCard, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, overflowX: 'auto', flexShrink: 0, borderBottom: `0.5px solid ${ZZ.divider}` }}>
        {filterChips.map((chip: string, i: number) => {
          const on = !!activeChips[i]
          return (
            <button key={chip} onClick={() => setActiveChips(p => ({ ...p, [i]: !p[i] }))} style={{ height: 26, padding: '0 10px', borderRadius: 4, background: on ? ZZ.brandBg : ZZ.bgPage, border: on ? `0.5px solid ${ZZ.brand}` : 'none', color: on ? ZZ.brand : ZZ.fg2, fontSize: 12, fontWeight: 300, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>{chip}</button>
          )
        })}
      </div>

      {/* Smart sort banner */}
      {smartBanner.show && (
        <div style={{ margin: '8px 12px 0', padding: '8px 10px', background: ZZ.warningBg, borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: ZZ.warning, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>AI</span>
          </div>
          <div style={{ flex: 1, fontSize: 11, color: ZZ.fg2, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 500, color: ZZ.fg1 }}>{smartBanner.text}</span>
            {smartBanner.subtext && <span> {smartBanner.subtext}</span>}
          </div>
        </div>
      )}

      {/* Result count */}
      <div style={{ padding: '5px 12px 2px', fontSize: 11, color: ZZ.fg3, fontWeight: 300, flexShrink: 0 }}>
        找到 <span style={{ color: ZZ.fg1, fontWeight: 400 }}>1,283</span> 件
      </div>

      {/* Product list */}
      <div style={{ flex: 1, overflowY: 'auto', background: ZZ.bgCard }}>
        {products.map((p) => (
          <div key={p.id} style={{ padding: '12px 12px', display: 'flex', gap: 10, borderBottom: `0.5px solid ${ZZ.divider}`, position: 'relative' }}>
            <div style={{ width: 90, height: 90, borderRadius: 4, background: '#ECECEC', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: ZZ.fg1, lineHeight: '20px', marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 300, color: conditionColor(p.condition), padding: '0 4px', border: `0.5px solid ${conditionColor(p.condition)}`, borderRadius: 2 }}>{p.condition}</span>
                <span style={{ fontSize: 10, fontWeight: 300, color: ZZ.fg3 }}>{p.conditionExtra}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {p.tags.map((t: any) => (
                  <span key={t.label} style={{ height: 14, padding: '0 4px', lineHeight: '14px', border: `0.5px solid ${t.border}`, borderRadius: 1, fontSize: 10, fontWeight: 300, color: t.color || t.border }}>{t.label}</span>
                ))}
                {p.promo && <span style={{ height: 14, padding: '0 4px', lineHeight: '14px', border: `0.5px solid ${ZZ.brand}`, borderRadius: 1, fontSize: 10, fontWeight: 300, color: ZZ.brand }}>{p.promo}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ZZ.fg1 }}>¥</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: ZZ.fg1, letterSpacing: -0.5 }}>{p.price}</span>
                <span style={{ fontSize: 10, color: ZZ.fg3, fontWeight: 300 }}>{p.sales}</span>
              </div>
            </div>
            <div onClick={() => toggleCompare(p.id)} style={{ position: 'absolute', bottom: 12, right: 12, width: 18, height: 18, borderRadius: 999, border: `1px solid ${compareItems.has(p.id) ? ZZ.brand : ZZ.stroke}`, background: compareItems.has(p.id) ? ZZ.brand : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {compareItems.has(p.id) && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          </div>
        ))}
        <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: ZZ.fgDim, fontWeight: 300 }}>· · · 已展示 4 / 1,283 件 · · ·</div>
      </div>

      {/* Compare FAB */}
      {compareItems.size > 0 && (
        <div style={{ position: 'absolute', bottom: 70, right: 14, zIndex: 20, background: ZZ.brand, borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(255,15,39,0.38)', cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="9" height="18" rx="1.5" stroke="white" strokeWidth="2"/><rect x="12" y="7" width="9" height="14" rx="1.5" stroke="white" strokeWidth="2"/></svg>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>对比 {compareItems.size} 件</span>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ height: 60, background: ZZ.bgCard, borderTop: `0.5px solid ${ZZ.divider}`, display: 'flex', flexShrink: 0 }}>
        {[
          { label: '首页', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21V13h6v8" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { label: '分类', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/></svg> },
          { label: '消息', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg> },
          { label: '我的', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg> },
        ].map((tab, i) => (
          <div key={tab.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            {tab.icon(i === 0 ? ZZ.brand : ZZ.fg3)}
            <span style={{ fontSize: 10, color: i === 0 ? ZZ.brand : ZZ.fg3, fontWeight: 300 }}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step6 ─────────────────────────────────────────────────────────────────────

interface Step6Props {
  project: any
  running?: boolean
  genLabel?: string
}

export const Step6: React.FC<Step6Props> = ({ project, running, genLabel }) => {
  const [device, setDevice] = React.useState('mobile')
  const [styleVariant, setStyleVariant] = React.useState('market')
  const [interactive, setInteractive] = React.useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      {running && <Generating label={genLabel || '重新生成高保真稿…'} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PrevStepHint label="基于 Step 03 概念方向 + 线框图 · 已通过 Lint 检查" />

        {/* Toolbar */}
        <Card padded={false}>
          <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.08 }}>风格</span>
              <Chip active={styleVariant === 'market'} onClick={() => setStyleVariant('market')}>二手电商风格</Chip>
              <Chip active={styleVariant === 'calm'} onClick={() => setStyleVariant('calm')}>通用编辑风</Chip>
            </div>
            <div style={{ width: 1, height: 16, background: 'var(--bd-1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.08 }}>设备</span>
              <Btn size="sm" variant="ghost" active={device === 'mobile'} onClick={() => setDevice('mobile')} icon="phone">Mobile</Btn>
              <Btn size="sm" variant="ghost" active={device === 'tablet'} onClick={() => setDevice('tablet')}>Tablet</Btn>
            </div>
            <div style={{ flex: 1 }} />
            <Chip tone={interactive ? 'ok' : 'default'} onClick={() => setInteractive(!interactive)} icon={interactive ? 'play' : 'pause'}>
              {interactive ? '可交互' : '已暂停'}
            </Chip>
            <Btn size="sm" variant="ghost" icon="code" onClick={() => {
              const html = window.DPData.step6?.html
              if (!html) return
              const escaped = html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              const page = `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>源代码 — 高保真</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#1e1e1e;color:#d4d4d4;font-family:'Menlo','Consolas',monospace;font-size:13px;line-height:1.6;padding:24px}pre{white-space:pre-wrap;word-break:break-all}.toolbar{position:sticky;top:0;background:#2d2d2d;padding:10px 16px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#888}.copy-btn{background:#0e639c;color:#fff;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;font-family:inherit}</style></head><body><div class="toolbar"><span>高保真 HTML 源码 · ${html.length.toLocaleString()} 字节</span><button class="copy-btn" onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent).then(()=>{this.textContent='已复制 ✓';setTimeout(()=>this.textContent='复制全部',2000)})">复制全部</button></div><pre>${escaped}</pre></body></html>`
              const blob = new Blob([page], { type: 'text/html;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              window.open(url, '_blank')
              setTimeout(() => URL.revokeObjectURL(url), 60000)
            }}>查看代码</Btn>
            <Btn size="sm" variant="outline" icon="external" onClick={() => {
              const html = window.DPData.step6?.html
              if (!html) return
              const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              window.open(url, '_blank')
              setTimeout(() => URL.revokeObjectURL(url), 60000)
            }}>新窗口打开</Btn>
            <Btn size="sm" variant="primary" icon="download" onClick={() => triggerDownload(genStep6HTML(), '06-hi-fi.html', 'text/html')}>导出 HTML</Btn>
          </div>
          {/* Lint passes */}
          <div style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid var(--bd-1)', fontSize: 11.5, color: 'var(--tx-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ok)' }}><Icon name="check" size={11} /> 字段一致性</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ok)' }}><Icon name="check" size={11} /> 保障标签卡片级</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ok)' }}><Icon name="check" size={11} /> 筛选可见可撤销</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ok)' }}><Icon name="check" size={11} /> 命中 6/6 标注</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ color: 'var(--tx-4)' }}>Lint v2 · 0 warnings</span>
          </div>
        </Card>

        {/* Preview */}
        <Card padded={false} style={{
          background: 'var(--bg-2)',
          minHeight: 844, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 32, gap: 40,
        }}>
          {/* LEFT: original uploaded page (if any) */}
          {window.DPData.uploadedImage && device === 'mobile' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.08, textTransform: 'uppercase' }}>原始页面</div>
              <div style={{
                width: 390, height: 844, borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--bd-1)', boxShadow: '0 20px 40px -16px rgba(0,0,0,0.15)',
                background: '#fff', flexShrink: 0,
              }}>
                <img src={window.DPData.uploadedImage} alt="原始页面" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
              </div>
            </div>
          )}

          {window.DPData.uploadedImage && device === 'mobile' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="var(--tx-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={{ fontSize: 10, color: 'var(--tx-4)', fontFamily: 'var(--mono)', letterSpacing: 0.04 }}>转转设计系统</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {window.DPData.uploadedImage && device === 'mobile' && (
              <div className="mono" style={{ fontSize: 10, color: 'var(--ac)', letterSpacing: 0.08, textTransform: 'uppercase' }}>优化方案</div>
            )}

            {device === 'mobile' ? (
              <div style={{
                position: 'relative', width: 390, height: 844, borderRadius: 12, overflow: 'hidden',
                background: '#fff', border: '1px solid var(--bd-1)',
                boxShadow: '0 16px 48px -16px rgba(0,0,0,0.16)', flexShrink: 0,
              }}>
                {window.DPData.step6 && window.DPData.step6.html
                  ? <iframe
                      srcDoc={window.DPData.step6.html}
                      style={{ width: 390, height: 844, border: 'none', display: 'block', pointerEvents: interactive ? 'auto' : 'none' }}
                      sandbox="allow-scripts allow-same-origin"
                      scrolling="no"
                      title="AI 生成高保真"
                    />
                  : styleVariant === 'market'
                    ? <ZZHiFiPage data={window.DPData.step6} />
                    : <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#999' }}>
                        <Icon name="doc" size={28} style={{ color: '#ddd' }} />
                        <span style={{ fontSize: 13 }}>通用编辑风格 · 暂无预览</span>
                      </div>
                }
              </div>
            ) : (
              <div style={{
                width: 768, height: 1024, borderRadius: 16, overflow: 'hidden',
                border: '1px solid var(--bd-1)', boxShadow: '0 20px 40px -16px rgba(0,0,0,0.15)',
                background: '#fff', flexShrink: 0,
              }}>
                {window.DPData.step6 && window.DPData.step6.html
                  ? <iframe
                      srcDoc={window.DPData.step6.html}
                      style={{ width: 768, height: 1024, border: 'none', display: 'block', pointerEvents: interactive ? 'auto' : 'none' }}
                      sandbox="allow-scripts allow-same-origin"
                      scrolling="no"
                      title="AI 生成高保真"
                    />
                  : <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>暂无预览</div>
                }
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  )
}

export default Step6
