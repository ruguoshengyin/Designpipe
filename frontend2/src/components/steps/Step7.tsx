import React from 'react'
import { Icon, Btn, Badge, Card, SectionTitle } from '../ui'
import { RightRail, RailSection, PrevStepHint } from './shared/RightRail'
import { ArtifactLink } from './shared/ArtifactLink'
import { triggerDownload, genStep1MD, genStep2MD, genStep6HTML, genDeliveryMD } from '../../utils/download'

// ── Section ───────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  body: string
  accent?: boolean
}

const Section: React.FC<SectionProps> = ({ title, body, accent }) => (
  <div>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ac)', letterSpacing: 0.08, marginBottom: 8 }}>
      {title.toUpperCase()}
    </div>
    <div className={accent ? 'serif' : ''} style={{
      fontSize: accent ? 18 : 14.5,
      color: 'var(--tx-1)', lineHeight: 1.65,
      fontWeight: accent ? 500 : 400,
    }}>{body}</div>
  </div>
)

// ── Step7 ─────────────────────────────────────────────────────────────────────

interface Step7Props {
  data: any
  project: any
  direction?: string
}

export const Step7: React.FC<Step7Props> = ({ data, project, direction }) => {
  const fileIcons: Record<string, string> = { md: 'doc', svg: 'doc', html: 'code', pdf: 'doc' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
        <PrevStepHint label="自动生成 · 无需确认" />

        {/* Hero summary */}
        <div style={{
          padding: '28px 28px', borderRadius: 16,
          background: 'linear-gradient(135deg, var(--ac-soft), transparent 70%)',
          border: '1px solid var(--ac-line)',
        }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ac)', letterSpacing: 0.1, marginBottom: 10 }}>
            HANDOFF SUMMARY · {project.id.toUpperCase()}
          </div>
          <h2 className="display" style={{ fontSize: 32, fontWeight: 700, margin: 0, color: 'var(--tx-1)', letterSpacing: -0.02 }}>
            {project.title}
          </h2>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <Badge tone="accent">方向 {direction || 'B'} · 能力增强</Badge>
            <Badge tone="outline">{project.tag}</Badge>
            <Badge tone="outline">{project.style}</Badge>
            <Badge tone="ok">5/5 步全完成</Badge>
          </div>
        </div>

        <Section title="项目背景" body={data.background} />
        <Section title="核心诊断" body={data.diagnosis} accent />
        <Section title="选定方向" body={data.direction} />

        {/* Key decisions */}
        <div>
          <SectionTitle eyebrow="DECISIONS" title="关键设计决策" subtitle={`${(data.decisions || []).length} 条 — 已在 Step 3/4 中体现`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.decisions || []).map((d: string, i: number) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                background: 'var(--bg-1)', border: '1px solid var(--bd-1)', borderRadius: 10,
              }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 700, minWidth: 28 }}>D-{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 13.5, color: 'var(--tx-2)', lineHeight: 1.6, flex: 1 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next */}
        <div>
          <SectionTitle eyebrow="NEXT" title="下一步建议" />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(data.next || []).map((n: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon name="arrow-right" size={14} style={{ color: 'var(--ac)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.6 }}>{n}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Files */}
        <div>
          <SectionTitle eyebrow="ARTIFACTS" title="文件索引" subtitle={`${(data.files || []).length} 份产物 · 可一键打包导出`} right={
            <Btn icon="download" variant="primary" onClick={() => {
              triggerDownload(genStep1MD(), '01-竞品分析.md', 'text/markdown')
              setTimeout(() => triggerDownload(genStep2MD(), '02-设计分析.md', 'text/markdown'), 400)
              setTimeout(() => triggerDownload(genStep6HTML(), '04-高保真.html', 'text/html'), 800)
              setTimeout(() => triggerDownload(genDeliveryMD(), '05-交付摘要.md', 'text/markdown'), 1200)
            }}>下载全部</Btn>
          } />
          <Card padded={false}>
            {(data.files || []).map((f: any, i: number) => {
              const dlMap: Record<string, () => void> = {
                '01-竞品分析.md': () => triggerDownload(genStep1MD(), f.name, 'text/markdown'),
                '02-设计分析.md': () => triggerDownload(genStep2MD(), f.name, 'text/markdown'),
                '04-高保真.html': () => triggerDownload(genStep6HTML(), f.name, 'text/html'),
                '05-交付摘要.md': () => triggerDownload(genDeliveryMD(), f.name, 'text/markdown'),
              }
              const onDl = dlMap[f.name]
              return (
                <div key={f.name} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderBottom: i === data.files.length - 1 ? 'none' : '1px solid var(--bd-1)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'var(--bg-2)', color: 'var(--ac)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--bd-1)',
                  }}>
                    <Icon name={fileIcons[f.type] || 'doc'} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--tx-1)' }}>{f.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--tx-4)', letterSpacing: 0.06 }}>
                      {f.type.toUpperCase()} · {f.size}
                    </div>
                  </div>
                  {onDl && <Btn size="sm" variant="ghost" icon="download" onClick={onDl} />}
                </div>
              )
            })}
          </Card>
        </div>
      </div>

      <RightRail>
        <RailSection title="项目时间线" defaultOpen={false}>
          {[
            { s: 'Step 01 竞品分析', t: '10:24' },
            { s: 'Step 02 设计分析', t: '10:31' },
            { s: 'Step 03 概念方向 + 线框图 · 方向 C', t: '10:42' },
            { s: 'Step 04 高保真', t: '10:55' },
            { s: 'Step 05 交付', t: '11:02' },
          ].map((it, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ac)' }} />
                {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--bd-1)', marginTop: 2 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 10 : 0 }}>
                <div style={{ color: 'var(--tx-2)' }}>{it.s}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--tx-4)' }}>{it.t}</div>
              </div>
            </div>
          ))}
        </RailSection>
        <RailSection title="后续" defaultOpen={false}>
          <Btn variant="soft" size="sm" icon="git-branch" style={{ width: '100%', marginBottom: 6 }}>从本项目分叉新版本</Btn>
          <Btn variant="ghost" size="sm" icon="external" style={{ width: '100%' }}>另存为模板</Btn>
        </RailSection>
      </RightRail>
    </div>
  )
}

export default Step7
