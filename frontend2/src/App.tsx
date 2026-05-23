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
    dpClearCache: any
  }
}

// ── API helpers ───────────────────────────────────────────────────────────────

/** Normalize a server project (snake_case) so UI components (camelCase) work correctly. */
const normalizeProject = (p: any): any => ({
  ...p,
  currentStep: p.currentStep ?? p.current_step ?? 0,
  maxStep: p.maxStep ?? p.max_step ?? 5,
  targetUser: p.targetUser ?? p.target_user ?? '',
  updatedAt: p.updatedAt ?? p.updated_at ?? '刚刚',
  collaborators: p.collaborators ?? [],
})

const API = {
  async listProjects(): Promise<any[]> {
    const res = await fetch('/api/projects')
    if (!res.ok) return []
    const list = await res.json()
    return list.map(normalizeProject)
  },
  async createProject(data: any): Promise<any> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return normalizeProject(await res.json())
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
  { idx: 1, name: '竞品分析', en: 'research', icon: 'search' },
  { idx: 2, name: '设计分析', en: 'diagnose', icon: 'layers' },
  { idx: 3, name: '概念·线框', en: 'concept',  icon: 'layout' },
  { idx: 4, name: '高保真',   en: 'hi-fi',    icon: 'smartphone' },
  { idx: 5, name: '交付总结', en: 'handoff',  icon: 'check-circle' },
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

// Cache key is project-specific to avoid cross-project data leakage
const _cacheKey = (pid?: string) => `dp_wf_v3_${pid || 'default'}`

window.dpLoadWorkflowState = (projectId?: string) => {
  try {
    const raw = localStorage.getItem(_cacheKey(projectId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
window.dpSaveWorkflowState = (state: any, projectId?: string) => {
  try {
    // Also snapshot current DPData step content so it survives page reloads
    const dpData = (window as any).DPData || {}
    const full = {
      ...state,
      _dpStep1: dpData.step1 || null,
      _dpStep2: dpData.step2 || null,
      _dpStep4: dpData.step4 || null,
      _dpStep7: dpData.step7 || null,
      _dpPageType: dpData.pageType || null,
      _dpUploadedImage: dpData.uploadedImage || null,
      // step6 (hi-fi HTML) can be very large — store separately under size limit
    }
    localStorage.setItem(_cacheKey(projectId), JSON.stringify(full))
    // Also store hi-fi HTML separately (may be large)
    if (dpData.step6?.html) {
      try { localStorage.setItem(_cacheKey(projectId) + '_hifi', dpData.step6.html) } catch {}
    }
  } catch {}
}
window.dpClearCache = (projectId?: string) => {
  try {
    localStorage.removeItem(_cacheKey(projectId))
    localStorage.removeItem(_cacheKey(projectId) + '_hifi')
  } catch {}
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
  const [creating, setCreating] = React.useState(false)

  // Load projects from API on mount — with retry on failure
  React.useEffect(() => {
    let cancelled = false
    const load = async (attempt = 0) => {
      try {
        const apiProjects = await API.listProjects()
        if (cancelled) return
        const all = [DEMO_PROJECT, ...apiProjects.filter((p: any) => p.id !== 'iphone15')]
        setProjects(all)
        window.DPData.projects = all
        setLoading(false)
      } catch {
        if (cancelled) return
        if (attempt < 4) {
          // Retry: 1s, 2s, 3s, 4s back-off — backend may still be starting
          setTimeout(() => load(attempt + 1), (attempt + 1) * 1000)
        } else {
          // Give up after 4 retries — show demo project only
          setLoading(false)
        }
      }
    }
    // Hard cap: never show loading spinner past 12s
    const cap = setTimeout(() => { if (!cancelled) setLoading(false) }, 12000)
    load()
    return () => { cancelled = true; clearTimeout(cap) }
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
    const step = p?.currentStep ?? p?.current_step ?? 0
    // Has progress if step > 0, OR if there's a saved cache for this project
    const hasCachedState = !!localStorage.getItem(`dp_wf_v3_${id}`)
    const hasProgress = (step > 0 || hasCachedState) && p?.status !== '草稿'
    setRoute({ view: 'workflow', projectId: id, skipKickoff: hasProgress })
  }

  const newProject = async () => {
    if (creating) return
    setCreating(true)
    // Create the project on server FIRST to get the real UUID, then navigate.
    // This avoids the temp-id ↔ server-uuid mismatch that causes state updates to be lost.
    let id: string
    const baseData = {
      product: '', target_user: '', scenario: '',
      title: '新设计项目', style: '通用风格', cover: 'new',
      status: '草稿', tag: '新建',
    }
    try {
      const saved = await API.createProject(baseData)
      id = saved.id
      const newP = {
        ...baseData, id,
        current_step: saved.current_step ?? 0,
        currentStep: saved.current_step ?? 0,
        max_step: saved.max_step ?? 5,
        maxStep: saved.max_step ?? 5,
        direction: null, updatedAt: '刚刚', collaborators: [], tag: '新建',
      }
      setProjects(prev => {
        const next = [...prev, newP]
        window.DPData.projects = next
        return next
      })
    } catch (e) {
      // API unavailable — fall back to offline temp id
      console.warn('Failed to create project on API, using temp id:', e)
      id = 'proj_' + Date.now()
      const newP = {
        id, title: '新设计项目', product: '', target_user: '', scenario: '',
        style: '通用风格', cover: 'new', current_step: 0, currentStep: 0,
        max_step: 5, maxStep: 5,
        direction: null, updatedAt: '刚刚', collaborators: [], status: '草稿', tag: '新建',
      }
      setProjects(prev => {
        const next = [...prev, newP]
        window.DPData.projects = next
        return next
      })
    }
    setCreating(false)
    setRoute({ view: 'workflow', projectId: id, skipKickoff: false })
  }

  const onProjectUpdate = async (id: string, updates: any) => {
    // Keep both snake_case (for API) and camelCase (for UI components) in sync
    const normalized = {
      ...updates,
      current_step: updates.currentStep ?? updates.current_step,
      currentStep:  updates.currentStep ?? updates.current_step,
      target_user:  updates.targetUser  ?? updates.target_user,
      targetUser:   updates.targetUser  ?? updates.target_user,
      max_step:     updates.maxStep     ?? updates.max_step,
      maxStep:      updates.maxStep     ?? updates.max_step,
    }
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...normalized } : p)
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
            projects={projects} setProjects={setProjects} creating={creating} />
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
