import React from 'react'
import { Home } from './views/Home'
import { Workflow } from './components/Workflow'
import { TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakButton } from './components/tweaks'
import { useTweaks } from './hooks/useTweaks'
import { dpLoadProjects as loadProjects, dpSaveProjects as saveProjects } from './constants/cache'
import { DPDesignSpec } from './constants/designSpec'

declare global {
  interface Window {
    DPData: any
    dpSetStep: any
    dpLoadWorkflowState: any
    dpSaveWorkflowState: any
    dpLoadProjects: any
    dpSaveProjects: any
  }
}

// ── Global DPData initialisation ─────────────────────────────────────────────
const DEMO_PROJECT = {
  id: 'iphone15',
  title: 'iPhone 15 转转详情页改版',
  product: '转转二手交易平台 iPhone 15 商品详情页',
  targetUser: '18-30岁二手手机买家',
  scenario: '用户在转转上浏览 iPhone 15，需要快速判断是否值得购买',
  style: '转转风格',
  cover: 'mobile',
  currentStep: 5,
  maxStep: 5,
  direction: null,
  updatedAt: '2天前',
  collaborators: ['Bingyao', 'Alex'],
  status: '进行中',
  tag: '改版',
}

const STEPS_META = [
  { idx: 1, name: '竞品分析', en: 'research',   icon: 'search' },
  { idx: 2, name: '设计分析', en: 'diagnose',   icon: 'layers' },
  { idx: 3, name: '概念方向', en: 'concept',    icon: 'lightbulb' },
  { idx: 4, name: '线框图',   en: 'wireframe',  icon: 'layout' },
  { idx: 5, name: '高保真',   en: 'hi-fi',      icon: 'smartphone' },
  { idx: 6, name: '标注交付', en: 'handoff',    icon: 'code' },
  { idx: 7, name: '总结',     en: 'summary',    icon: 'check-circle' },
]

const savedProjects = loadProjects()
const allProjects = savedProjects.length > 0
  ? [DEMO_PROJECT, ...savedProjects]
  : [DEMO_PROJECT]

window.DPData = {
  projects: allProjects,
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
window.dpLoadProjects = loadProjects
window.dpSaveProjects = saveProjects

// ── Tweaks defaults ───────────────────────────────────────────────────────────
const DEFAULTS = {
  theme: 'light',
  density: 'comfortable',
  font: 'sans',
  accent: 'orange',
  chatOpen: false,
}

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
  const [projects, setProjects] = React.useState(window.DPData.projects)

  // Apply tweaks → root data-attrs and CSS vars
  React.useEffect(() => {
    document.documentElement.dataset.density = t.density
    document.documentElement.dataset.font = t.font
    const pal = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES.orange
    const [ac, ac2] = pal.light
    const root = document.documentElement
    root.style.setProperty('--ac', ac)
    root.style.setProperty('--ac-2', ac2)
  }, [t.density, t.font, t.accent])

  const openProject = (id: string) => {
    const p = projects.find((x: any) => x.id === id)
    const hasProgress = p && p.currentStep > 0 && p.status !== '草稿'
    setRoute({ view: 'workflow', projectId: id, skipKickoff: hasProgress })
  }

  const newProject = () => {
    const id = 'proj_' + Date.now()
    const newP = {
      id,
      title: '新设计项目',
      product: '',
      targetUser: '',
      scenario: '',
      style: '通用风格',
      cover: 'new',
      currentStep: 0,
      maxStep: 5,
      direction: null,
      updatedAt: '刚刚',
      collaborators: [],
      status: '草稿',
      tag: '新建',
    }
    window.DPData.projects = [...projects, newP]
    setProjects(window.DPData.projects)
    setRoute({ view: 'workflow', projectId: id, skipKickoff: false })
  }

  const onProjectUpdate = (id: string, updates: any) => {
    setProjects((prev: any[]) => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p)
      window.DPData.projects = next
      window.dpSaveProjects(next.filter((p: any) => p.id !== 'iphone15'))
      return next
    })
  }

  const goHome = () => setRoute({ view: 'home' })

  return (
    <>
      {route.view === 'home'
        ? <Home onOpenProject={openProject} onNewProject={newProject}
            projects={projects} setProjects={setProjects} />
        : <Workflow projectId={route.projectId} skipKickoff={route.skipKickoff}
            onBack={goHome} onProjectUpdate={onProjectUpdate}
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
          <TweakRadio
            label="字体"
            value={t.font}
            onChange={(v: string) => setTweak('font', v)}
            options={[{ value: 'sans', label: 'Sans' }, { value: 'serif', label: 'Serif' }]}
          />
          <TweakRadio
            label="密度"
            value={t.density}
            onChange={(v: string) => setTweak('density', v)}
            options={[{ value: 'compact', label: '紧凑' }, { value: 'comfortable', label: '舒适' }]}
          />
        </TweakSection>
        <TweakSection label="布局">
          <TweakToggle
            label="AI 协作面板"
            value={chatOpen}
            onChange={(v: boolean) => { setChatOpen(v); setTweak('chatOpen', v) }}
          />
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
