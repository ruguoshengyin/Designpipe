import React from 'react'
import { Icon } from '../components/ui'
import { ProjectCard, NewProjectCard, ProjectList } from '../components/project'

interface HomeProps {
  onOpenProject: (id: string) => void
  onNewProject: () => void
  projects: any[]
  setProjects: (p: any[]) => void
  creating?: boolean
}

export const Home: React.FC<HomeProps> = ({ onOpenProject, onNewProject, projects, setProjects, creating }) => {
  const [view, setView] = React.useState('grid')
  const [filter, setFilter] = React.useState('all')
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null)
  const [deleting, setDeleting] = React.useState(false)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/projects/${deleteTarget.id}`, { method: 'DELETE' })
      setProjects(projects.filter(p => p.id !== deleteTarget.id))
      const cached = localStorage.getItem(`dp_wf_v3_${deleteTarget.id}`)
      if (cached) localStorage.removeItem(`dp_wf_v3_${deleteTarget.id}`)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  React.useEffect(() => {
    const el = document.createElement('style')
    el.id = 'home-v2-styles'
    el.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
      @keyframes cardIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .card-animate { animation: cardIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .home-v2-root {
        background: var(--bg-1);
        min-height: 100vh;
      }
      .filter-btn { transition: all 0.15s ease; cursor: pointer; }
      .filter-btn:hover { background: rgba(0,0,0,0.05) !important; }
      .filter-btn.active { background: white !important; border: 1px solid rgba(0,0,0,0.09) !important; color: var(--tx-1) !important; }
    `
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  const counts = {
    all: projects.length,
    progress: projects.filter(p => p.status === '进行中' || p.status === '高保真中').length,
    draft: projects.filter(p => p.status === '草稿').length,
    done: projects.filter(p => p.status === '已交付').length,
  }

  const filtered = projects.filter(p => {
    if (filter === 'all') return true
    if (filter === 'progress') return p.status === '进行中' || p.status === '高保真中'
    if (filter === 'draft') return p.status === '草稿'
    if (filter === 'done') return p.status === '已交付'
    return true
  })

  return (
    <>
    <div className="home-v2-root">
      <div style={{ padding: '52px 60px 100px', maxWidth: 1360, margin: '0 auto' }}>

        {/* Hero */}
        <div className="fadeUp" style={{ marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid var(--bd-1)',
            borderRadius: 999, padding: '4px 14px',
            marginBottom: 22,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999,
              background: 'var(--ac)', display: 'inline-block',
            }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--tx-3)', letterSpacing: 0.07, fontWeight: 600 }}>
              DESIGNPIPE v2.0 · AI 流水线在线
            </span>
          </div>

          <h1 style={{
            fontSize: 54, fontWeight: 750, margin: '0 0 18px',
            letterSpacing: -0.03, lineHeight: 1.06,
            color: 'var(--tx-1)',
          }}>
            把 UX 设计流程，<br />
            做成一条
            <span style={{ color: 'var(--ac)' }}>可追溯</span>的流水线。
          </h1>

          <p style={{
            fontSize: 15.5, color: 'var(--tx-3)', maxWidth: 540,
            margin: '0 0 30px', lineHeight: 1.65,
          }}>
            5 步从竞品分析到高保真交付，AI 协作 + 人审节点。每一步都可回溯、可分叉、可复用。
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={onNewProject} disabled={creating} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 42, padding: '0 22px', fontFamily: 'inherit',
              background: creating ? 'var(--tx-4)' : 'var(--ac)', color: 'white',
              border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600,
              cursor: creating ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s, transform 0.15s, background 0.2s',
            }}
              onMouseEnter={e => !creating && ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
              onMouseDown={e => !creating && ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget as HTMLButtonElement).style.transform = 'none'}
            >
              {creating
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>创建中…</>
                : <><Icon name="plus" size={15} />新建设计项目</>
              }
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <button onClick={() => onOpenProject('iphone15')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 42, padding: '0 20px', fontFamily: 'inherit',
              background: 'white', color: 'var(--tx-1)',
              border: '1px solid var(--bd-1)', borderRadius: 11, fontSize: 14, fontWeight: 500,
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bd-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bd-1)'}
            >
              <Icon name="play" size={14} />
              查看示例
            </button>

            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--tx-4)' }}>
              <span style={{ color: '#10b981', fontSize: 14, lineHeight: '1' }}>●</span>
              平均 12 分钟出方案
            </div>
          </div>
        </div>

        {/* Pipeline Strip */}
        <div className="fadeUp" style={{
          marginBottom: 44,
          background: 'white',
          borderRadius: 18,
          padding: '20px 24px 22px',
          border: '1px solid var(--bd-1)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Icon name="sparkles" size={13} style={{ color: 'var(--ac)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx-2)', letterSpacing: -0.01 }}>七步设计流程</span>
            <div style={{ width: 1, height: 12, background: 'var(--bd-1)', margin: '0 4px' }} />
            <span className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', letterSpacing: 0.04 }}>RESEARCH → HANDOFF</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {(window as any).DPData.steps.map((s: any, i: number) => (
              <React.Fragment key={s.idx}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                    background: i === 0 ? 'var(--ac)' : 'var(--bg-2)',
                    border: `1.5px solid ${i === 0 ? 'var(--ac)' : 'var(--bd-1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11.5, fontWeight: 700,
                    color: i === 0 ? 'white' : 'var(--tx-3)',
                    fontFamily: 'var(--mono)',
                  }}>
                    {s.idx}
                  </div>
                  <div style={{ textAlign: 'center', maxWidth: 80 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tx-1)', lineHeight: 1.3 }}>{s.name}</div>
                    <div className="mono" style={{ fontSize: 9.5, color: 'var(--tx-4)', letterSpacing: 0.04, marginTop: 3 }}>
                      {s.en.toUpperCase()}
                    </div>
                  </div>
                </div>
                {i < 6 && (
                  <div style={{
                    flex: 1, height: 1.5, marginTop: 15,
                    background: 'var(--bd-1)',
                    minWidth: 12,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Filter + Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            display: 'flex', gap: 2, padding: 3,
            background: 'white', border: '1px solid var(--bd-1)',
            borderRadius: 11,
          }}>
            {[
              { k: 'all', label: '全部', n: counts.all },
              { k: 'progress', label: '进行中', n: counts.progress },
              { k: 'draft', label: '草稿', n: counts.draft },
              { k: 'done', label: '已交付', n: counts.done },
            ].map(t => (
              <button key={t.k} onClick={() => setFilter(t.k)} className="filter-btn"
                style={{
                  height: 30, padding: '0 12px',
                  border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: filter === t.k ? 'var(--ac)' : 'transparent',
                  color: filter === t.k ? 'white' : 'var(--tx-3)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s ease',
                }}>
                {t.label}
                <span className="mono" style={{
                  fontSize: 10, fontWeight: 700,
                  opacity: filter === t.k ? 0.75 : 0.45,
                }}>{t.n}</span>
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 36, padding: '0 14px',
            background: 'white', border: '1px solid var(--bd-1)',
            borderRadius: 10, color: 'var(--tx-4)', fontSize: 12.5, minWidth: 250,
          }}>
            <Icon name="search" size={13} />
            <span>搜索项目、目标用户…</span>
            <div style={{ flex: 1 }} />
            <span className="kbd">⌘K</span>
          </div>

          <div style={{
            display: 'flex', gap: 2, padding: 3,
            background: 'white', border: '1px solid var(--bd-1)',
            borderRadius: 10,
          }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                width: 30, height: 30, border: 'none', borderRadius: 7,
                background: view === v ? 'var(--bg-2)' : 'transparent',
                color: view === v ? 'var(--ac)' : 'var(--tx-4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <Icon name={v} size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Grid / List */}
        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} onOpen={() => onOpenProject(p.id)} onDelete={() => setDeleteTarget(p)} index={i} />
            ))}
            <NewProjectCard onClick={onNewProject} loading={creating} />
          </div>
        ) : (
          <ProjectList projects={filtered} onOpen={onOpenProject} />
        )}

      </div>
    </div>

    {/* Delete Confirm Modal */}
    {deleteTarget && (
      <div
        onClick={() => !deleting && setDeleteTarget(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(17,17,17,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.12s ease',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: 22,
            padding: '32px 32px 28px',
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.10)',
            animation: 'slideUp 0.16s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,0,0,0.04)', borderRadius: 6,
            padding: '3px 9px', marginBottom: 20,
          }}>
            <Icon name="trash-2" size={11} style={{ color: 'var(--tx-4)' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx-4)', letterSpacing: 0.2 }}>删除项目</span>
          </div>

          {/* Title */}
          <div style={{
            fontSize: 17, fontWeight: 660, color: 'var(--tx-1)',
            lineHeight: 1.35, letterSpacing: -0.3,
            marginBottom: 10,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {deleteTarget.title}
          </div>

          {/* Description */}
          <div style={{
            fontSize: 13, color: 'var(--tx-3)', lineHeight: 1.65,
            marginBottom: 28,
            paddingBottom: 28,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}>
            此操作将永久清除该项目的所有设计数据，且无法撤销。
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              style={{
                flex: 1, height: 40, borderRadius: 11,
                border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)',
                fontSize: 13.5, fontWeight: 500, color: 'var(--tx-2)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
            >
              取消
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              style={{
                flex: 1, height: 40, borderRadius: 11,
                border: 'none',
                background: 'var(--ac)',
                fontSize: 13.5, fontWeight: 600, color: 'white',
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 0.12s, transform 0.1s',
                opacity: deleting ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!deleting) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { if (!deleting) e.currentTarget.style.opacity = '1' }}
              onMouseDown={e => { if (!deleting) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {deleting ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  删除中…
                </>
              ) : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Home
