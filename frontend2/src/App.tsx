import React from 'react'
import { Home } from './views/Home'
import { Workflow } from './components/Workflow'
import { TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakButton } from './components/tweaks'
import { useTweaks } from './hooks/useTweaks'
import { DPDesignSpec } from './constants/designSpec'

declare global {
  interface Window {
    DPData: any
    dpSetStep: any
    dpLoadWorkflowState: any
    dpSaveWorkflowState: any
  }
}

// ── API helpers ───────────────────────────────────────────────────────────────

const API = {
  async listProjects(): Promise<any[]> {
    const res = await fetch('/api/projects')
    if (!res.ok) return []
    return res.json()
  },
  async createProject(data: any): Promise<any> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  async updateProject(id: string, updates: any): Promise<void> {
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  },
  async deleteProject(id: string): Promise<void> {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
  },
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEMO_PROJECT = {
  id: 'iphone15',
  title: 'iPhone 15 转转详情页改版',
  product: '转转二手交易平台 iPhone 15 商品详情页',
  target_user: '18-30岁二手手机买家',
  scenario: '用户在转转上浏览 iPhone 15，需要快速判断是否值得购买',
  style: '转转风格',
  cover: 'mobile',
  current_step: 5,
  max_step: 5,
  direction: null,
  updatedAt: '2天前',
  collaborators: ['Bingyao', 'Alex'],
  status: '进行中',
  tag: '改版',
}

const STEPS_META = [
  { idx: 1, name: '竞品分析', en: 'research',  icon: 'search' },
  { idx: 2, name: '设计分析', en: 'diagnose',  icon: 'layers' },
  { idx: 3, name: '概念方向', en: 'concept',   icon: 'lightbulb' },
  { idx: 4, name: '线框图',   en: 'wireframe', icon: 'layout' },
  { idx: 5, name: '高保真',   en: 'hi-fi',     icon: 'smartphone' },
  { idx: 6, name: '标注交付', en: 'handoff',   icon: 'code' },
  { idx: 7, name: '总结',     en: 'summary',   icon: 'check-circle' },
]

// ── Init global DPData ────────────────────────────────────────────────────────

window.DPData = {
  projects: [DEMO_PROJECT],
  steps: STEPS_META,
  step1: null, step2: null, step3: null, step4: null,
  step5: null, step6: null, step7: null,
  qa: {},
  uploadedImage: null,
  pageType: 'detail',
  chosenCompetitors: [],
  _lastBrief: '',
  _strategyModules: [],
  designSpec: DPDesignSpec,
}

window.dpLoadWorkflowState = () => {
  try {
    const raw = localStorage.getItem('dp_wf_state_v2')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
window.dpSaveWorkflowState = (state: any) => {
  try { localStorage.setItem('dp_wf_state_v2', JSON.stringify(state)) } catch {}
}

// ── Tweaks ────────────────────────────────────────────────────────────────────

const DEFAULTS = { theme: 'light', density: 'comfortable', font: 'sans', accent: 'orange', chatOpen: false }

const ACCENT_PALETTES: Record<string, { light: [string, string]; swatch: string }> = {
  orange: { light: ['#cc785c', '#b8654a'], swatch: '#cc785c' },
  cyan:   { light: ['#2a9fdb', '#1d89c4'], swatch: '#2a9fdb' },
  violet: { light: ['#8b5cf6', '#7c3aed'], swatch: '#8b5cf6' },
  green:  { light: ['#4a9d6f', '#3d8b5f'], swatch: '#4a9d6f' },
}
const SWATCH_TO_ACCENT = Object.fromEntries(
  Object.entries(ACCENT_PALETTES).map(([k, v]) => [v.swatch, k])
)

// ── App ───────────────────────────────────────────────────────────────────────

const App = () => {
  const [t, setTweak] = useTweaks(DEFAULTS)
  const [route, setRoute] = React.useState<any>({ view: 'home' })
  const [chatOpen, setChatOpen] = React.useState(t.chatOpen)
  const [projects, setProjects] = React.useState<any[]>([DEMO_PROJECT])
  const [loading, setLoading] = React.useState(true)

  // Load projects from API on mount
  React.useEffect(() => {
    API.listProjects().then(apiProjects => {
      const all = [DEMO_PROJECT, ...apiProjects.filter((p: any) => p.id !== 'iphone15')]
      setProjects(all)
      window.DPData.projects = all
    }).catch(() => {
      // API unavailable — keep demo project
    }).finally(() => setLoading(false))
  }, [])

  // Apply tweaks
  React.useEffect(() => {
    document.documentElement.dataset.density = t.density
    document.documentElement.dataset.font = t.font
    const pal = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES.orange
    const [ac, ac2] = pal.light
    document.documentElement.style.setProperty('--ac', ac)
    document.documentElement.style.setProperty('--ac-2', ac2)
  }, [t.density, t.font, t.accent])

  const openProject = (id: string) => {
    const p = projects.find((x: any) => x.id === id)
    const hasProgress = p && (p.current_step || p.currentStep || 0) > 0 && p.status !== '草稿'
    setRoute({ view: 'workflow', projectId: id, skipKickoff: hasProgress })
  }

  const newProject = async () => {
    const id = 'proj_' + Date.now()
    const newP = {
      id, title: '新设计项目', product: '', target_user: '', scenario: '',
      style: '通用风格', cover: 'new', current_step: 0, max_step: 5,
      direction: null, updatedAt: '刚刚', collaborators: [], status: '草稿', tag: '新建',
    }
    // Optimistic update — add to UI immediately
    const withNew = [...projects, newP]
    setProjects(withNew)
    window.DPData.projects = withNew
    setRoute({ view: 'workflow', projectId: id, skipKickoff: false })
    // Persist to API in background
    try {
      const saved = await API.createProject({
        product: '', target_user: '', scenario: '',
        title: '新设计项目', style: '通用风格', cover: 'new',
        status: '草稿', tag: '新建',
      })
      // Replace temp project with real one from server (keeps same UI project by id override)
      setProjects(prev => prev.map(p => p.id === id ? { ...newP, ...saved } : p))
    } catch (e) {
      console.warn('Failed to save project to API:', e)
    }
  }

  const onProjectUpdate = async (id: string, updates: any) => {
    // Normalize field names (frontend uses camelCase, API uses snake_case)
    const normalized = {
      ...updates,
      current_step: updates.currentStep ?? updates.current_step,
      target_user: updates.targetUser ?? updates.target_user,
      max_step: updates.maxStep ?? updates.max_step,
    }
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates, ...normalized } : p)
      window.DPData.projects = next
      return next
    })
    // Skip API update for demo project
    if (id !== 'iphone15') {
      try {
        await API.updateProject(id, normalized)
      } catch (e) {
        console.warn('Failed to sync project update:', e)
      }
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--tx-4)', fontSize: 14 }}>
        加载中…
      </div>
    )
  }

  return (
    <>
      {route.view === 'home'
        ? <Home onOpenProject={openProject} onNewProject={newProject}
            projects={projects} setProjects={setProjects} />
        : <Workflow projectId={route.projectId} skipKickoff={route.skipKickoff}
            onBack={() => setRoute({ view: 'home' })}
            onProjectUpdate={onProjectUpdate}
            chatOpen={chatOpen} setChatOpen={setChatOpen} />
      }

      <TweaksPanel title="Tweaks">
        <TweakSection label="主题">
          <TweakColor
            label="强调色"
            value={ACCENT_PALETTES[t.accent].swatch}
            onChange={(hex: string) => setTweak('accent', SWATCH_TO_ACCENT[hex] || 'orange')}
            options={Object.values(ACCENT_PALETTES).map(p => p.swatch)}
          />
        </TweakSection>
        <TweakSection label="排版">
          <TweakRadio label="字体" value={t.font} onChange={(v: string) => setTweak('font', v)}
            options={[{ value: 'sans', label: 'Sans' }, { value: 'serif', label: 'Serif' }]} />
          <TweakRadio label="密度" value={t.density} onChange={(v: string) => setTweak('density', v)}
            options={[{ value: 'compact', label: '紧凑' }, { value: 'comfortable', label: '舒适' }]} />
        </TweakSection>
        <TweakSection label="布局">
          <TweakToggle label="AI 协作面板" value={chatOpen}
            onChange={(v: boolean) => { setChatOpen(v); setTweak('chatOpen', v) }} />
        </TweakSection>
        <TweakSection label="跳转">
          <TweakButton label="回到项目列表" onClick={() => setRoute({ view: 'home' })} />
          <TweakButton label="进入示例项目" onClick={() => setRoute({ view: 'workflow', projectId: 'iphone15' })} secondary />
        </TweakSection>
      </TweaksPanel>
    </>
  )
}

export default App
