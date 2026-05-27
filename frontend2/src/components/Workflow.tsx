import React from 'react'
import { Icon, Btn, Spinner } from './ui'
import { PipelineStrip } from './pipeline'
import { Step1 } from './steps/Step1'
import { Step2 } from './steps/Step2'
import { Step3 } from './steps/Step3'
import { Step6 } from './steps/Step6'
import { Step7 } from './steps/Step7'
import { ChatPanel } from './ChatPanel'
import { Kickoff } from './Kickoff'
import { buildQAContext } from '../utils/ai'

// ── Workflow ──────────────────────────────────────────────────────────────────

interface WorkflowProps {
  projectId: string
  skipKickoff?: boolean
  onBack: () => void
  onProjectUpdate?: (id: string, updates: any) => void
  chatOpen: boolean
  setChatOpen: (v: boolean) => void
}

export const Workflow: React.FC<WorkflowProps> = ({
  projectId, skipKickoff, onBack, onProjectUpdate, chatOpen, setChatOpen,
}) => {
  const project = (window as any).DPData.projects.find((p: any) => p.id === projectId)

  const _cachedWF = React.useMemo(() => (window as any).dpLoadWorkflowState(projectId), [projectId])

  // Restore DPData step content from cache on first mount (survives page reload)
  React.useMemo(() => {
    if (!_cachedWF) return
    const dp = (window as any).DPData
    if (_cachedWF._dpStep1 && !dp.step1) dp.step1 = _cachedWF._dpStep1
    if (_cachedWF._dpStep2 && !dp.step2) dp.step2 = _cachedWF._dpStep2
    if (_cachedWF._dpStep4 && !dp.step4?.directions?.length) dp.step4 = _cachedWF._dpStep4
    if (_cachedWF._dpStep7 && !dp.step7) dp.step7 = _cachedWF._dpStep7
    if (_cachedWF._dpPageType && !dp.pageType) dp.pageType = _cachedWF._dpPageType
    if (_cachedWF._dpUploadedImage && !dp.uploadedImage) dp.uploadedImage = _cachedWF._dpUploadedImage
    // Restore hi-fi HTML separately
    if (!dp.step6?.html) {
      try {
        const hifi = localStorage.getItem(`dp_wf_v3_${projectId}_hifi`)
        if (hifi) dp.step6 = { ...(dp.step6 || {}), html: hifi }
      } catch {}
    }
  }, [_cachedWF, projectId])

  const _hasCachedSteps = !!(
    (window as any).DPData.step1?.competitors?.length ||
    (window as any).DPData.step2?.diagnosis ||
    (window as any).DPData.step4?.directions?.length ||
    (window as any).DPData.step6?.html
  )

  const [currentStep, setCurrentStep] = React.useState<number | null>(() => {
    if (skipKickoff) {
      const cached = _cachedWF?.currentStep
      const fromProject = project?.currentStep
      return Math.max(1, cached || fromProject || 1)
    }
    if (_hasCachedSteps && _cachedWF?.currentStep) return _cachedWF.currentStep
    return null
  })

  const [completedStep, setCompletedStep] = React.useState<number>(() => {
    if (skipKickoff) {
      const cached = _cachedWF?.completedStep
      const fromProject = project?.completedStep ?? (project?.currentStep ? project.currentStep - 1 : 0)
      return cached ?? fromProject ?? 0
    }
    return _hasCachedSteps && _cachedWF?.completedStep ? _cachedWF.completedStep : 0
  })

  const [runningStep, setRunningStep] = React.useState<any>(null)
  const [chosenDirection, setChosenDirection] = React.useState<string | null>(
    (_cachedWF?.chosenDirection) || project?.direction || null
  )
  const [pipelineHidden, setPipelineHidden] = React.useState(false)
  const [contentVersion, setContentVersion] = React.useState(0)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [progressMsg, setProgressMsg] = React.useState<string | null>(null)
  const [genLabel, setGenLabel] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Restore step data from API when no localStorage cache exists (e.g. after backend restart)
  React.useEffect(() => {
    if (!skipKickoff) return          // Draft project — nothing to restore
    if (projectId === 'iphone15') return  // Demo project — uses hardcoded data
    if (_cachedWF) return             // localStorage already has everything

    const dp = (window as any).DPData
    const pid = projectId
    const get = (n: number) => fetch(`/api/projects/${pid}/steps/${n}`).then(r => r.ok ? r.json() : null).catch(() => null)

    Promise.allSettled([get(0), get(1), get(2), get(3), get(4)]).then(results => {
      const [s0, s1, s2, s3, s4] = results.map(r => r.status === 'fulfilled' ? r.value : null)
      let changed = false
      if (s0?.content && !dp.step1) { try { dp.step1 = JSON.parse(s0.content); changed = true } catch {} }
      if (s1?.content && !dp.step2?.diagnosis) { try { dp.step2 = { ...dp.step2, ...JSON.parse(s1.content) }; changed = true } catch {} }
      if (s2?.content && !dp.step4?.directions?.length) { try { dp.step4 = { ...dp.step4, ...JSON.parse(s2.content) }; changed = true } catch {} }
      if (s3?.content && !dp.step6?.html) { dp.step6 = { html: s3.content }; changed = true }
      if (s4?.content && !dp.step7?.background) { try { dp.step7 = { ...dp.step7, ...JSON.parse(s4.content) }; changed = true } catch {} }
      if (changed) setContentVersion(v => v + 1)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Listen for chat close event
  React.useEffect(() => {
    const handler = () => setChatOpen(false)
    window.addEventListener('closeChat', handler)
    return () => window.removeEventListener('closeChat', handler)
  }, [setChatOpen])

  // Listen for content update from chat
  React.useEffect(() => {
    const handler = () => {
      setContentVersion(v => v + 1)
      setRunningStep(currentStep)
      setTimeout(() => setRunningStep(null), 1800)
    }
    window.addEventListener('updateContent', handler)
    return () => window.removeEventListener('updateContent', handler)
  }, [currentStep])

  // Hide pipeline on scroll down
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let lastY = el.scrollTop
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = el.scrollTop
          const delta = currentY - lastY
          if (Math.abs(delta) > 5) {
            if (currentY > 100 && delta > 0) setPipelineHidden(true)
            else if (delta < 0 && currentY < 50) setPipelineHidden(false)
          }
          lastY = currentY
          ticking = false
        })
        ticking = true
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Show kickoff on first load
  if (currentStep === null) {
    return (
      <Kickoff
        project={project}
        onBack={onBack}
        onStart={(step) => {
          const s1 = (window as any).DPData.step1 || {}
          const brief = (window as any).DPData._lastBrief || {}
          const product = brief.product || s1.objective?.replace(/^围绕「/, '').replace(/」.*$/, '') || project.title
          const title = product + (brief.goal ? '·' + brief.goal.slice(0, 10) : '')
          if (onProjectUpdate) onProjectUpdate(projectId, {
            title,
            product: brief.product || '',
            targetUser: brief.targetUser || '',
            currentStep: step,
            completedStep: step - 1,
            status: '进行中',
            updatedAt: '刚刚',
            color: project.color || '#cc785c',
            tag: brief.product ? brief.product.slice(0, 4) : '新建',
          })
          setCurrentStep(step)
        }}
      />
    )
  }

  const step = (window as any).DPData.steps[currentStep - 1]

  // Robust JSON extractor
  const extractJSON = (text: string) => {
    let t = text
      .replace(/```(?:json|JSON)?\s*\n?/g, '')
      .replace(/\n?```\s*$/g, '')
      .trim()
    const start = t.indexOf('{')
    if (start === -1) return null
    const tries = [t.lastIndexOf('}'), t.lastIndexOf('},'), t.lastIndexOf('"}')]
    for (const end of tries) {
      if (end <= start) continue
      let raw = t.slice(start, end + 1)
      raw = raw.replace(/,(\s*[}\]])/g, '$1')
      try { return JSON.parse(raw) } catch {}
    }
    for (let i = t.length - 1; i > start; i--) {
      if (t[i] !== '}') continue
      let raw = t.slice(start, i + 1)
      raw = raw.replace(/,(\s*[}\]])/g, '$1')
      try { return JSON.parse(raw) } catch {}
    }
    return null
  }

  // Call AI proxy and collect full streamed JSON response
  const aiJSON = async (prompt: string, image?: string | null, timeoutMs = 120000) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const body: any = { messages: [{ role: 'user', content: prompt }] }
    if (image) body.image = image
    let res: Response
    try {
      res = await fetch('/api/proxy-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (e: any) {
      clearTimeout(timer)
      if (e.name === 'AbortError') throw new Error('AI 响应超时（超过 120 秒），请重试')
      throw new Error(`网络错误：${e.message}，请确认 Designpipe 后端正在运行`)
    }
    if (!res.ok) { clearTimeout(timer); throw new Error(`HTTP ${res.status}`) }
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let full = '', buf = ''
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()!
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const chunk = line.slice(6)
          if (chunk === '[DONE]') break
          try {
            const content = JSON.parse(chunk).content || ''
            if (content.startsWith('__ERROR__')) {
              const rest = content.slice(9)
              const sep = rest.indexOf('::')
              const code = sep !== -1 ? rest.slice(0, sep) : rest
              const msg = sep !== -1 ? rest.slice(sep + 2) : rest
              const err: any = new Error(msg); err.code = code; throw err
            }
            full += content
          } catch (e: any) { if (e.code !== undefined) throw e }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') { clearTimeout(timer); throw e }
    }
    clearTimeout(timer)
    const parsed = extractJSON(full)
    if (!parsed) throw new Error(`JSON解析失败，原始回复：${full.slice(0, 200)}`)
    return parsed
  }

  // Collect full streamed text (for HTML generation)
  const aiText = async (prompt: string, image?: string | null, signal?: AbortSignal | null, maxTokens?: number) => {
    const body: any = { messages: [{ role: 'user', content: prompt }] }
    if (image) body.image = image
    if (maxTokens) body.max_tokens = maxTokens
    const res = await fetch('/api/proxy-chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal || undefined,
    })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let full = '', buf = ''
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()!
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const chunk = line.slice(6)
          if (chunk === '[DONE]') break
          try {
            const content = JSON.parse(chunk).content || ''
            if (content.startsWith('__ERROR__')) {
              const rest = content.slice(9)
              const sep = rest.indexOf('::')
              const code = sep !== -1 ? rest.slice(0, sep) : rest
              const msg = sep !== -1 ? rest.slice(sep + 2) : rest
              const err: any = new Error(msg); err.code = code; throw err
            }
            full += content
          } catch (e: any) { if (e.code !== undefined) throw e }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') throw e
    }
    return full
  }

  const confirmStep = async () => {
    const newCompleted = currentStep! > completedStep ? currentStep! : completedStep
    if (currentStep! > completedStep) setCompletedStep(newCompleted)
    if (currentStep! >= 5) return
    const nextStep = currentStep! + 1
    if (currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4) {
      await generateForStep(currentStep!)
    }
    setCurrentStep(nextStep)
    ;(window as any).dpSaveWorkflowState({ currentStep: nextStep, completedStep: newCompleted, chosenDirection }, projectId)
    if (onProjectUpdate) onProjectUpdate(projectId, {
      currentStep: nextStep,
      completedStep: newCompleted,
      updatedAt: '刚刚',
      status: nextStep >= 5 ? '已交付' : '进行中',
    })
  }

  // ── generateForStep: delegates to /api/generate for real projects ────────────
  const generateForStep = async (step: number) => {
    const isDemo = projectId === 'iphone15'
    if (!isDemo) {
      return _generateViaAPI(step)
    }
    // Demo project: silently skip (already has pre-loaded data)
  }

  const _generateViaAPI = async (step: number) => {
    const overlayLabels: Record<number, string> = {
      1: '设计分析中…', 2: '概念方向生成中…', 3: '高保真设计稿生成中…', 4: '交付文档生成中…',
    }
    setRunningStep(step)
    setErrorMsg(null)
    setGenLabel(overlayLabels[step] || '')
    setProgressMsg(`正在生成内容…`)

    try {
      // For step 1: first save research data (step 0) to DB
      if (step === 1) {
        const step1Data = (window as any).DPData.step1
        if (step1Data) {
          await fetch(`/api/projects/${projectId}/steps/0`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data_type: 'json', content: JSON.stringify(step1Data) }),
          })
        }
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          step,
          direction: chosenDirection,
          image: (window as any).DPData.uploadedImage,
          qa_context: buildQAContext(),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()!
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))

            if (evt.progress) {
              setProgressMsg(evt.progress)

            } else if (evt.error) {
              throw new Error(evt.error)

            } else if (evt.phase_done === 'diagnose') {
              // Step 1 result: design analysis JSON
              ;(window as any).DPData.step2 = { ...(window as any).DPData.step2, ...evt.data }
              setContentVersion(v => v + 1)

            } else if (evt.phase_done === 'page_type') {
              ;(window as any).DPData.pageType = evt.data

            } else if (evt.phase_done === 'concept') {
              // Step 2 phase 1: concept directions
              ;(window as any).DPData.step4 = { ...(window as any).DPData.step4, ...evt.data }
              setContentVersion(v => v + 1)

            } else if (typeof evt.phase_done === 'string' && evt.phase_done.startsWith('wireframe_')) {
              // Step 2 phase 2-4: wireframe for each direction
              const key = evt.phase_done.replace('wireframe_', '')
              const dirs = (window as any).DPData.step4?.directions || []
              const d = dirs.find((x: any) => x.key === key)
              if (d) {
                d.wireframeHTML = evt.data.html
                d.wireframeSummary = evt.data.summary
              }
              setContentVersion(v => v + 1)

            } else if (evt.phase_done === 'decompose') {
              ;(window as any).DPData._strategyModules = evt.data

            } else if (evt.phase_done === 'handoff') {
              ;(window as any).DPData.step7 = { ...(window as any).DPData.step7, ...evt.data }
              setContentVersion(v => v + 1)

            } else if (evt.done) {
              // Generation complete — load saved result from API
              if (step === 3) {
                const r = await fetch(`/api/projects/${projectId}/steps/3`)
                if (r.ok) {
                  const { content } = await r.json()
                  ;(window as any).DPData.step6 = { html: content }
                  setContentVersion(v => v + 1)
                }
              }
            }
          } catch (e: any) {
            if (e.message) throw e
          }
        }
      }
    } catch (e: any) {
      const isQuota = (e.code || '').includes('quota') || (e.message || '').includes('quota') || (e.message || '').includes('配额')
      if (isQuota) {
        setErrorMsg('__QUOTA__')
      } else {
        setErrorMsg(`AI 生成失败：${e.message || '网络错误，请检查后端服务是否运行'}`)
      }
    } finally {
      setProgressMsg(null)
      setGenLabel('')
      setRunningStep(null)
      setContentVersion(v => v + 1)
    }
  }

  const _generateForStep_legacy = async (step: number) => {
    const s1 = (window as any).DPData.step1 || {}
    const s2 = (window as any).DPData.step2 || {}
    const brief = `分析目标：${s1.objective || ''}\n设计输入：${(s1.inputs || []).slice(0, 3).join('；')}`
    setRunningStep(step)
    setErrorMsg(null)
    const overlayLabels: Record<number, string> = { 1: '设计分析中…', 2: '概念方向生成中…', 3: '高保真设计稿生成中…', 4: '交付文档生成中…' }
    const stepLabels: Record<number, string> = { 1: '设计分析', 2: '概念方向 + 线框图', 3: '高保真设计稿', 4: '交付文档' }
    setGenLabel(overlayLabels[step] || '')
    setProgressMsg(`正在生成${stepLabels[step] || '内容'}…`)
    try {
      if (step === 1) {
        setProgressMsg('正在生成设计分析…（约 20 秒）')
        const result = await aiJSON(`你是资深UX设计师。基于以下竞品分析背景，生成设计分析，只返回JSON不加说明：
${brief}${buildQAContext()}
{"diagnosis":"核心问题2句","decisionModel":[{"label":"目标锁定","text":"15字"},{"label":"快速过滤","text":"15字"},{"label":"横向比对","text":"15字"},{"label":"信任校验","text":"15字"},{"label":"进入详情","text":"15字"}],"tensions":[{"name":"张力1","expr":"18字","design":"18字"},{"name":"张力2","expr":"18字","design":"18字"},{"name":"张力3","expr":"18字","design":"18字"}],"judgements":["判断1","判断2","判断3"],"opportunities":[{"p":"P0","name":"机会1","why":"15字","impact":"10字"},{"p":"P0","name":"机会2","why":"15字","impact":"10字"},{"p":"P1","name":"机会3","why":"15字","impact":"10字"},{"p":"P1","name":"机会4","why":"15字","impact":"10字"},{"p":"P2","name":"机会5","why":"15字","impact":"10字"}],"principles":["原则1","原则2","原则3","原则4"]}`)
        ;(window as any).DPData.step2 = { ...(window as any).DPData.step2, ...result }
      } else if (step === 2) {
        setProgressMsg('正在识别页面类型…')
        const uploadedImage = (window as any).DPData.uploadedImage
        if (uploadedImage) {
          try {
            const pt = await aiText(
              `这是一张移动端 App 截图。请用5到8个字精确描述这个页面的类型，例如"发布商品页"、"商品详情页"、"搜索结果列表页"、"个人中心页"、"订单列表页"等。只输出页面类型名称，不加任何其他文字。`,
              uploadedImage
            )
            ;(window as any).DPData.pageType = pt.trim().replace(/["""。]/g, '').substring(0, 20)
          } catch {
            ;(window as any).DPData.pageType = '移动端页面'
          }
        } else {
          try {
            const pt = await aiText(
              `根据以下项目描述，推断这是移动端 App 的哪个页面类型。用5到8个字回答，例如"发布商品页"、"商品详情页"、"搜索结果列表页"等。只输出页面类型，不加任何其他文字。\n\n项目描述：${s1.objective || ''}\n设计输入：${(s1.inputs || []).slice(0, 2).join('；')}`
            )
            ;(window as any).DPData.pageType = pt.trim().replace(/["""。]/g, '').substring(0, 20)
          } catch {
            ;(window as any).DPData.pageType = '移动端页面'
          }
        }
        const pageType = (window as any).DPData.pageType
        setProgressMsg('正在生成 3 个概念方向…（约 20 秒）')
        const diagnosis = s2.diagnosis || s1.objective || ''
        const opps = (s2.opportunities || []).map((o: any) => `${o.p} ${o.name}`).join('；')
          || (s1.inputs || []).slice(0, 3).join('；')
        const result = await aiJSON(`你是资深UX设计师。基于以下设计背景，生成3个差异化概念方向，只返回JSON不加说明：
诊断：${diagnosis}
机会点：${opps}
页面类型：${pageType}
${brief}${buildQAContext()}

{"directions":[{"key":"A","title":"方向名(4字)","subtitle":"定位(12字)","oneliner":"策略(30字)","moves":["动作1(12字)","动作2","动作3"],"advantage":"优势(18字)","tradeoff":"代价(18字)","cost":"low","impact":"影响(12字)","cite":"对应机会"},{"key":"B","title":"...","subtitle":"...","oneliner":"...","moves":["...","...","..."],"advantage":"...","tradeoff":"...","cost":"med","impact":"...","cite":"...","recommended":true},{"key":"C","title":"...","subtitle":"...","oneliner":"...","moves":["...","...","..."],"advantage":"...","tradeoff":"...","cost":"high","impact":"...","cite":"..."}],"recommendation":{"pick":"B","reason":"推荐理由(35字)"}}`)
        ;(window as any).DPData.step4 = { ...(window as any).DPData.step4, ...result }

        // Generate wireframes for each direction sequentially
        const wireframePrompt = (d: any) => `你是UX设计师。用户的项目页面类型是【${pageType}】，截图就是这个页面。请生成一份**${pageType}**的移动端黑白线框图HTML，不得改变页面类型。

【项目】
${s1.objective || ''}
诊断：${s2.diagnosis || ''}

【该方向】
${d.title}——${d.oneliner}
关键动作：${(d.moves || []).join('；')}

【关键要求】
- 页面类型必须是【${pageType}】，严禁生成其他类型的页面
- 参考截图里的信息架构（章节、字段、按钮、底部操作栏），按"该方向"重新组织布局
- 体现该设计方向的特征（分组前置、流程可视化、模块合并等）

【线框图规范】
- 黑白灰阶：仅用 #FFFFFF / #F5F5F5 / #E8E8E8 / #CCCCCC / #999999 / #333333
- 禁止彩色、渐变、阴影
- 灰色矩形/圆角矩形代替图片占位
- 章节标题、按钮文字、Tab 文字保留真实文字，正文用灰色色块代替

【技术】
- width: 390px, height: 844px, overflow: hidden, margin: 0
- font-family: 'PingFang SC', -apple-system, sans-serif
- 样式用 <style> 标签内联
- 只返回完整 HTML，从 <!DOCTYPE html> 开始，不加说明文字、不要 markdown 代码块`

        const dirs = (window as any).DPData.step4.directions || []
        for (let i = 0; i < dirs.length; i++) {
          const d = dirs[i]
          setRunningStep(`wf${i + 1}`)
          setProgressMsg(`正在生成线框图 ${d.key}… (${i + 1}/${dirs.length})，请稍候约 30 秒`)
          try {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 90000)
            const wHtml = await aiText(wireframePrompt(d), uploadedImage, controller.signal)
            clearTimeout(timer)
            if (!wHtml || wHtml.trim().length < 100) throw new Error('空响应或响应太短')
            const m = wHtml.match(/<!DOCTYPE[\s\S]*<\/html>/i) || wHtml.match(/<html[\s\S]*<\/html>/i)
            d.wireframeHTML = m ? m[0] : wHtml.replace(/```\w*\n?/g, '').replace(/```/g, '').trim()

            setProgressMsg(`正在解析线框图 ${d.key} 结构…`)
            try {
              const summary = await aiText(
                `分析以下移动端线框图HTML，提取页面区域结构，输出简洁列表。
每行格式：区域名 | 高度或比例 | 核心内容描述（20字内）
要求：
- 从上到下按顺序列出所有区域
- 高度写具体px（如44px）或比例（如flex:1）
- 内容描述说清楚有什么元素（按钮/列表/输入框等）
- 不超过15行，只输出列表，不加任何说明

线框图HTML：
${d.wireframeHTML.replace(/<style[\s\S]*?<\/style>/gi, '').slice(0, 6000)}`
              )
              d.wireframeSummary = summary.trim()
            } catch (e: any) {
              console.warn(`线框图 ${d.key} 摘要提取失败，降级用HTML`, e.message)
              d.wireframeSummary = ''
            }
            setProgressMsg(null)
          } catch (e: any) {
            console.warn(`线框图 ${d.key} 生成失败:`, e.message)
            setProgressMsg(null)
            setErrorMsg(`线框图 ${d.key} 生成失败（${e.message}），已跳过，继续下一个`)
            d.wireframeHTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=390,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}body{width:390px;height:844px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-family:'PingFang SC',sans-serif}</style></head><body><div style="text-align:center;color:#999"><div style="font-size:32px;margin-bottom:12px">⚠️</div><div style="font-size:14px">方向 ${d.key} 线框图生成失败</div><div style="font-size:12px;margin-top:8px">可在 Chat 面板重新生成</div></div></body></html>`
            d.wireframeSummary = ''
          }
          setContentVersion(v => v + 1)
        }
        setProgressMsg(null)
        setRunningStep(step)
      } else if (step === 3) {
        const dirKey = chosenDirection || ((window as any).DPData.step4?.recommendation || {}).pick || 'B'
        const dirs = (window as any).DPData.step4?.directions || []
        const dir = dirs.find((d: any) => d.key === dirKey) || dirs[1] || {}
        const pageType = (window as any).DPData.pageType || s1.objective || '移动端页面'
        const productKeyword = (() => {
          const obj = s1.objective || ''
          const m = obj.match(/「([^」]+)」/) || obj.match(/『([^』]+)』/)
          if (m) return m[1].replace(/搜索结果页.*|优化.*|改造.*/, '').trim()
          return ''
        })()
        const navTitle = productKeyword || pageType

        const hasSummary = !!(dir.wireframeSummary && dir.wireframeSummary.length > 30)
        const rawWireframe = dir.wireframeHTML || ''
        const hasRawWireframe = rawWireframe.length > 500 && !rawWireframe.includes('生成失败')
        const wireframeRef = hasSummary
          ? dir.wireframeSummary
          : hasRawWireframe
            ? rawWireframe
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/`/g, "'")
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 4000)
            : ''
        const hasWireframe = hasSummary || hasRawWireframe
        const wireframeMode = hasSummary ? '摘要' : hasRawWireframe ? 'HTML' : '无'

        setProgressMsg('正在把策略拆解为具体组件…（约 10 秒）')
        let strategyModules: any[] = []
        try {
          const planRes = await aiJSON(`你是资深UX设计师。把下面的设计策略，针对【${pageType}】这个具体页面，拆成可直接落地的UI模块清单。
规则：
- 每个"关键动作"至少对应1个具体模块，可以多个
- 模块必须是页面上看得见的真实UI（卡片/横幅/步骤条/浮层/标签/分组等），不能是抽象描述
- "signal"要写出让用户一眼能认出该策略的视觉特征
只返回JSON不加说明：

选定方向：${dir.title || ''}——${dir.oneliner || ''}
关键动作：
${(dir.moves || []).map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}
页面类型：${pageType}
${hasWireframe ? `线框结构参考：\n${wireframeRef.slice(0, 1500)}` : ''}

{"modules":[{"move":"对应关键动作原文","name":"模块名(6字内)","where":"页面位置(如nav-bar下方/列表每项内/底部栏上方)","what":"长什么样含哪些元素(30字内)","signal":"一眼识别的视觉特征(如红色必填标/横向步骤条/对比浮层)"}]}`)
          strategyModules = (planRes && Array.isArray(planRes.modules)) ? planRes.modules.filter((m: any) => m && m.name) : []
        } catch (e: any) { console.warn('策略拆解失败，降级用原始moves:', e.message) }
        ;(window as any).DPData._strategyModules = strategyModules

        const strategyBlock = strategyModules.length
          ? strategyModules.map((m: any, i: number) => `  ${i + 1}. 【${m.name}】（服务策略：${m.move || ''}）\n       位置：${m.where || '自定'}　形态：${m.what || ''}　识别特征：${m.signal || ''}`).join('\n')
          : (dir.moves || []).map((m: string, i: number) => `  【动作${i + 1}】${m}\n        → 必须为它设计一个具体的、显眼的 UI 元素来承载`).join('\n')

        setProgressMsg('高保真设计稿生成中…（约 30 秒）')
        const html = await aiText(`你是转转资深移动端UX工程师。本次任务有两个层次，顺序不可颠倒：
① 首先必须 100% 落实下面的【设计策略】——这是这个页面之所以存在的理由；
② 然后在策略骨架上套用转转设计规范（视觉皮肤）。
两者冲突时——策略优先。

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
⚡ 设计策略（最高优先级，必须逐条"看得见"地落地）
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
页面类型：【${pageType}】　导航栏标题：【${navTitle}】

▶ 选定方向：${dir.title || ''}${dir.subtitle ? `（${dir.subtitle}）` : ''}
▶ 核心策略：${dir.oneliner || ''}
▶ 方向优势：${dir.advantage || ''}

▶ 必含模块清单（${strategyModules.length || (dir.moves || []).length} 个，缺一不可，逐个对照实现）——
  下面每一项都是必须出现在页面上的真实 UI 模块。你要严格按"位置/形态/识别特征"把它做出来，
  做完后逐条核对：这个模块在页面上找得到吗？用户能一眼认出它的"识别特征"吗？
${strategyBlock}

项目背景：${s1.objective || ''}
诊断痛点：${s2.diagnosis || ''}

⚠️ 这不是"普通页面还原"，而是"用【${dir.title || '选定方向'}】这个策略去重新设计【${pageType}】"。
   上面每个模块都必须真实落地。如果生成的页面与一个默认的【${pageType}】没有可见区别、
   或上述任一模块缺失/只是文字提及而无对应 UI，本次输出即判定为失败，必须补齐后再输出。
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

下面是转转设计规范（视觉细节约束，套在上述策略之上，不得削弱策略）：

${(window as any).DPDesignSpec}


█████████████████████████████████████████
🚫 页面结构规则（第一优先级 · 完整 iOS 全屏截图）
█████████████████████████████████████████
页面是一张完整的手机全屏截图，从上到下结构严格固定：
① status-bar（44px 状态栏）→ ② nav-bar（44px 导航栏）→ ③ content（flex:1）→ ④ bottom-bar（如有）。总高严格 844px。

✅ 第一个子元素必须是 status-bar（44px）：左侧"9:41"，右侧 信号/wifi/电池 SVG（见下方模板，必须照抄）
✅ 第二个子元素是 nav-bar（44px）：返回箭头 SVG + 居中标题 + 可选右侧操作
✗ 禁止灵动岛 / 刘海 / 黑色椭圆（status-bar 是平的白底栏，不画硬件挖孔）
✗ 禁止底部 home 横条
✗ 禁止手机外壳 / 圆角黑框 / 任何模拟手机外形的容器（外框由预览容器提供）
✗ 禁止商品卡图片区的勾选圆圈 / 对勾 / 选中标记（✓ ✔ fa-check 等）
✗ 禁止规范外装饰（星形评分、悬浮心形、进度圈、勋章）

正确结构：
<body>
  <div id="screen">
    <div id="status-bar">9:41 ··· 信号 wifi 电池</div>  ← 第一个，44px
    <div id="nav-bar">← 返回  [标题]  [右侧操作]</div>
    <div id="content">...</div>
    <div id="bottom-bar">...</div>
  </div>
</body>

【状态栏模板——必须照抄到 #screen 顶部】
<div style="height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:#fff;flex-shrink:0">
  <span style="font-size:15px;font-weight:600;color:#111;letter-spacing:0.5px">9:41</span>
  <div style="display:flex;align-items:center;gap:6px">
    <svg width="17" height="11" viewBox="0 0 17 11" fill="#111"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
    <svg width="16" height="11" viewBox="0 0 16 12" fill="#111"><path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM8 5a6 6 0 014.3 1.8l-1.4 1.4A4 4 0 008 7a4 4 0 00-2.9 1.2L3.7 6.8A6 6 0 018 5zM8 1a10 10 0 017.1 3l-1.4 1.4A8 8 0 008 3a8 8 0 00-5.7 2.4L0.9 4A10 10 0 018 1z"/></svg>
    <div style="width:25px;height:12px;border:1px solid rgba(0,0,0,0.35);border-radius:3px;padding:1px;display:flex;align-items:center;position:relative">
      <div style="width:70%;height:100%;background:#111;border-radius:1.5px"></div>
      <div style="position:absolute;right:-3px;top:3.5px;width:2px;height:5px;background:rgba(0,0,0,0.35);border-radius:0 1px 1px 0"></div>
    </div>
  </div>
</div>
█████████████████████████████████████████

【成色 Badge 精确颜色——必须严格执行】
· 99新 → background:#2E6E89; color:#fff（青色，不得用蓝/灰替代）
· 95新/A级/B级/S级 → background:#EE8B57; color:#fff（橙色，不得用橙红替代）
· 卖点chip（次日达/已验机/7天无理由）→ 0.5px边框+透明底：
    次日达/在仓直发/促销 → border:0.5px solid #FF0F27; color:#FF0F27; background:transparent
    已验机/7天无理由 → border:0.5px solid #111; color:#111; background:transparent
    一年质保/同款销量 → border:0.5px solid #2E6E89; color:#2E6E89; background:transparent
· 价格 ¥数字 → color:#111111 font-weight:700 font-size:20px（绝对禁止红色）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
必须写在 <head> 内的内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<!-- 关键：锁定viewport为390px，防止iframe内默认980px缩放导致错位 -->
<meta name="viewport" content="width=390, initial-scale=1.0, maximum-scale=1.0">

图标规则：禁止引入任何外部图标库CDN，一律使用内联SVG。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
必须使用的 CSS Reset（来源：转转 Figma 真实规范）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/* ===== ZHUAN RESET ===== */
*, *::before, *::after {
  box-sizing: border-box !important;
  margin: 0; padding: 0;
  -webkit-tap-highlight-color: transparent;
}
html { width: 390px; max-width: 390px; overflow: hidden; }
body {
  width: 390px; max-width: 390px; height: 844px;
  overflow: hidden;
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #FFFFFF;
  -webkit-font-smoothing: antialiased;
  font-weight: 300;
}
div, section, header, footer, nav, main, ul, li { max-width: 100%; }
img, svg { display: block; max-width: 100%; }
button { border: none; cursor: pointer; font-family: inherit; background: none; }
a { text-decoration: none; color: inherit; }
.price, [class*="price"] { color: #111111 !important; }
/* ===== END RESET ===== */

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
布局结构（来源：选定方向线框图）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 必须包含（顺序固定）：① status-bar（44px，照抄上方模板）→ ② nav-bar（44px，背景#fff，含返回箭头SVG + 居中页面标题 + 可选右侧操作）。

${hasWireframe ? `【布局蓝图（来源：方向${dirKey}线框图·${wireframeMode}）——必须严格遵循】
以下是选定方向的页面结构，你的任务是将每个区域翻译为转转设计语言的高保真 UI：
· 严格保留每个区域的顺序，不增不删
· 保持各区域高度/比例（flex:1 的区域仍为 flex:1）
· 每个区域的内容类型 → 用上方对应的转转组件模板实现
· 结构是骨架，转转规范是皮肤，两者叠加不冲突

[LAYOUT]
${wireframeRef}
[/LAYOUT]` : `【布局骨架参考（页面类型：${pageType}）】
按页面类型构建合理结构：nav-bar 44px → 内容区 flex:1 → Tab bar 60px，总高 844px。`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
内容要求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 填写与项目背景一致的真实中文数据（商品名、价格、卖点等）
- 价格整数，无小数，无千分位逗号（¥4280 不是 ¥4,280.00）
- 型号原样保留大小写：iPhone、GUCCI、LV
- 不用"示例""测试""Lorem"等占位文字
- 所有图片用占位框+SVG，不引用任何外部图片URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
输出前自查（违规必须在HTML内修正后再输出）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ 选定方向是【${dir.title || ''}】，上面 ${(dir.moves || []).length} 个【关键动作】是否每条都有一个一眼能认出的专属 UI 模块？
□ 页面类型是【${pageType}】？导航栏标题是【${navTitle}】？
□ #screen 第一个子元素是 status-bar（44px，左 9:41 + 右 信号/wifi/电池 SVG）？
□ 第二个子元素是 nav-bar（44px，含返回箭头SVG + 居中标题）？
□ 没有灵动岛/刘海/黑色挖孔、没有底部 home 横条、没有手机外壳？
□ <head>里有 <meta name="viewport" content="width=390,initial-scale=1.0,maximum-scale=1.0"> ？
□ CSS Reset有 *{box-sizing:border-box;margin:0;padding:0} 且 body{width:390px;height:844px;overflow:hidden} ？
□ 所有图标用内联SVG，没有emoji/文字替代/外部CDN图标？
□ 没有任何外部资源引用（无CDN link/script/img src="http"）？
□ 价格颜色是#111111（黑色），绝对不能用红色？
□ Tab bar 高度60px（不是80px）？
□ 商品卡图片区没有勾选圆圈、没有对勾、没有任何选中标记？
□ 布局总高=各固定区域高度之和+content(flex:1)=844px？`, (window as any).DPData.uploadedImage, undefined, 16000)

        const m = html.match(/<!DOCTYPE[\s\S]*<\/html>/i) || html.match(/<html[\s\S]*<\/html>/i)
        let finalHtml = m ? m[0] : html.replace(/```\w*\n?/g, '').replace(/```/g, '').trim()
        if (!finalHtml.match(/<\/html>/i)) {
          if (!finalHtml.match(/<\/body>/i)) finalHtml += '\n</body>'
          finalHtml += '\n</html>'
        }

        // Strategy compliance check pass
        if (strategyModules.length) {
          setProgressMsg('正在核对策略模块是否落地…（约 20 秒）')
          try {
            const checkPrompt = `你是UX设计稿质检员。下面这份高保真HTML本应落地一套"必含模块"，请逐条核对，把"缺失"或"只是文字提及但没有对应UI"的模块补进HTML，最后返回完整修正后的HTML。

【本页必含模块清单——逐条核对】
${strategyModules.map((m: any, i: number) => `${i + 1}. 【${m.name}】位置:${m.where || '自定'}｜形态:${m.what || ''}｜识别特征:${m.signal || ''}`).join('\n')}

【核对方法】
- 对每个模块，在HTML里找它对应的真实UI元素（不是注释、不是纯文字一句话）
- 找到且符合"识别特征" → 保留
- 找不到 / 只是文字带过 / 不符合识别特征 → 在"位置"处补出符合"形态+识别特征"的真实UI

【硬约束】
- 只增补缺失模块、修正不达标模块，不得删除已有业务区块
- 必须保留顶部 status-bar（44px）与 nav-bar，结构顺序不变
- 整页仍是 390×844、overflow:hidden，补内容后若超高则压缩各区域间距，不得溢出
- 沿用页面已有的转转视觉风格（颜色/字号/圆角），不要引入新风格
- 直接返回完整HTML，从<!DOCTYPE html>开始，禁止markdown代码块、禁止任何说明文字

【待核对HTML】
${finalHtml}`
            const checked = await aiText(checkPrompt, (window as any).DPData.uploadedImage, undefined, 16000)
            const cm = checked.match(/<!DOCTYPE[\s\S]*<\/html>/i) || checked.match(/<html[\s\S]*<\/html>/i)
            if (cm && cm[0].length > 500) finalHtml = cm[0]
          } catch (e: any) { console.warn('策略核对 pass 失败，沿用首轮结果:', e.message) }
        }

        // Design fidelity review pass
        try {
          const reviewPrompt = `你是转转设计系统审核员。下面是一份高保真HTML，请逐项对照转转规范，找出违规并直接返回修正后的完整HTML。

⚠️ 你只修视觉细节（字体/字重/字号/颜色/圆角/间距），绝对不要改动页面的信息架构与功能模块：
· 必须完整保留顶部 status-bar（44px，9:41 + 信号/wifi/电池）与 nav-bar，顺序不变
· 必须保留所有体现设计策略的功能模块/交互（不得因"简化"而删除任何业务区块）
· 只调整样式，不删结构、不增删区域

${(window as any).DPDesignSpec}

【审查项（每项必查）】
1. 字体：font-family 必须是 'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif
2. 字重只用 300/400/500/700/800
3. 字号只用 9/10/12/13/14/16/18/20px
4. 价格必须 #111111（绝对禁止红色）
5. 页面背景必须 #FFFFFF，chip背景必须 #F5F5F5
6. 卖点标签：radius 1px；商品图（横版）：radius 4px；成色badge：radius 999px
7. 商品卡片：白底+无描边+无圆角+无阴影，卡片间 1px #F0F0F0 分割线
8. Tab bar 高度 60px
9. 商品卡图片区绝对禁止：勾选圆圈/绿色对勾/任何选中标记

【输出要求】
- 返回完整修正后的HTML，从<!DOCTYPE html>开始
- 禁止markdown代码块包裹

【待审HTML】
${finalHtml}`
          const reviewed = await aiText(reviewPrompt, undefined, undefined, 16000)
          const rm = reviewed.match(/<!DOCTYPE[\s\S]*<\/html>/i) || reviewed.match(/<html[\s\S]*<\/html>/i)
          if (rm) finalHtml = rm[0]
        } catch {}

        // Post-process: forcibly inject layout reset + image fallback
        const dpReset = `
<meta name="viewport" content="width=390,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style id="dp-guaranteed-reset">
@font-face{font-family:"PingFang SC";font-weight:300;font-style:normal;src:url("/fonts/PingFangSC-Light.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:400;font-style:normal;src:url("/fonts/PingFangSC-Regular.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:500;font-style:normal;src:url("/fonts/PingFangSC-Medium.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:700;font-style:normal;src:url("/fonts/PingFangSC-Bold.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:600;font-style:normal;src:url("/fonts/PingFangSC-SemiBold.ttf") format("truetype");font-display:swap;}
*,*::before,*::after{box-sizing:border-box!important;}
html{width:390px!important;max-width:390px!important;overflow:hidden!important;margin:0!important;padding:0!important;}
body{width:390px!important;max-width:390px!important;height:844px!important;overflow:hidden!important;margin:0!important;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif!important;background:#FFFFFF!important;font-weight:300!important;}
.price,[class*="price"]{color:#111111!important;}
body *{max-width:390px!important;}
body > div,body > section,body > main,body > header,body > footer,body > nav,body > #screen,body > #app{width:100%!important;max-width:100%!important;}
body{overflow-wrap:break-word;word-break:break-word;}
img,svg,video,canvas{max-width:100%!important;}
</style>
<script>
(function(){
  function fixImg(img){var w=img.getAttribute('width')||img.offsetWidth||80;var h=img.getAttribute('height')||img.offsetHeight||80;var ph=document.createElement('div');ph.style.cssText='width:'+w+'px;height:'+h+'px;background:#ECECEC;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';ph.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';if(img.parentNode)img.parentNode.replaceChild(ph,img);}
  function isDarkBg(bg){var m=bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);if(m){var r=+m[1],g=+m[2],b=+m[3];return r<60&&g<60&&b<60;}return false;}
  function killPhoneChrome(){var maxIter=5;while(maxIter-->0){var first=document.body.firstElementChild;if(!first)break;var s=window.getComputedStyle(first);var br=parseInt(s.borderRadius)||0;var w=first.offsetWidth;var h=first.offsetHeight;if(isDarkBg(s.backgroundColor)&&br>=20&&w>=350&&h>=600&&first.children.length>=1){while(first.firstChild)document.body.insertBefore(first.firstChild,first);first.remove();continue;}if(br>=20&&w>=350&&h>=600&&first.children.length===1){var inner=first.firstElementChild;var is=window.getComputedStyle(inner);if(parseInt(is.borderRadius)>=10){while(first.firstChild)document.body.insertBefore(first.firstChild,first);first.remove();continue;}}break;}document.querySelectorAll('*').forEach(function(el){var s=window.getComputedStyle(el);var r=el.getBoundingClientRect();if(!isDarkBg(s.backgroundColor))return;if(r.top<6&&r.width>=200&&r.height<=12){el.style.display='none';}if(r.bottom>document.body.offsetHeight-30&&r.width>=60&&r.height<=14){el.style.display='none';}});}
  function fixPriceStyle(){var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);var n;var priceNodes=[];while(n=walker.nextNode()){if(/¥\\s*\\d/.test(n.nodeValue)||/^\\s*\\d{2,}(\\.\\d+)?\\s*$/.test(n.nodeValue)&&n.parentElement&&/¥/.test(n.parentElement.textContent)){priceNodes.push(n);}}priceNodes.forEach(function(node){var p=node.parentElement;if(p){p.style.cssText+=';color:#111111 !important;font-family:"PingFang SC",-apple-system,sans-serif !important;font-weight:700 !important;';var anc=p.parentElement;for(var i=0;i<2&&anc&&anc!==document.body;i++){var cs=window.getComputedStyle(anc).color;if(/(255,\\s*15|255,\\s*72|FF0F27|FF483C)/i.test(cs)){anc.style.color='#111111';}anc=anc.parentElement;}}});}
  function makeInteractive(){
    /* 1. Chip / tag groups — clicking a chip selects it, deselects siblings */
    document.querySelectorAll('*').forEach(function(parent){
      var children=Array.from(parent.children);
      if(children.length<2||children.length>8)return;
      var chips=children.filter(function(el){
        var s=window.getComputedStyle(el);
        var r=el.getBoundingClientRect();
        return r.width>20&&r.width<160&&r.height>20&&r.height<56&&
          (s.borderRadius!=='0px'||s.border!=='0px none rgb(0, 0, 0)')&&
          (el.tagName==='BUTTON'||el.tagName==='SPAN'||el.tagName==='DIV')&&
          !el.querySelector('img')&&(el.textContent||'').trim().length>0&&
          (el.textContent||'').trim().length<20;
      });
      if(chips.length===children.length&&chips.length>=2){
        chips.forEach(function(chip){
          if(chip.dataset.dpChip)return;
          chip.dataset.dpChip='1';
          chip.style.cursor='pointer';
          chip.addEventListener('click',function(){
            var active=chip.dataset.dpActive==='1';
            /* radio-style: deselect all siblings first */
            chips.forEach(function(c){
              if(c.dataset.dpOrigBg===undefined)c.dataset.dpOrigBg=c.style.backgroundColor||'';
              if(c.dataset.dpOrigColor===undefined)c.dataset.dpOrigColor=c.style.color||'';
              if(c.dataset.dpOrigBorder===undefined)c.dataset.dpOrigBorder=c.style.border||'';
              c.style.backgroundColor=c.dataset.dpOrigBg;
              c.style.color=c.dataset.dpOrigColor;
              c.style.border=c.dataset.dpOrigBorder;
              c.dataset.dpActive='0';
            });
            if(!active){
              chip.style.backgroundColor='#FF0F27';
              chip.style.color='#fff';
              chip.style.border='none';
              chip.dataset.dpActive='1';
            }
          });
        });
      }
    });
    /* 2. Accordion / collapsible rows — click header to toggle body */
    document.querySelectorAll('*').forEach(function(el){
      if(el.dataset.dpAccordion)return;
      var ch=Array.from(el.children);
      if(ch.length!==2)return;
      var header=ch[0],body=ch[1];
      var hr=header.getBoundingClientRect(),br=body.getBoundingClientRect();
      if(hr.height<16||hr.height>64||br.height===0)return;
      var hText=(header.textContent||'').trim();
      if(hText.length===0||hText.length>40)return;
      /* check body is "taller" content area */
      if(br.height<24)return;
      el.dataset.dpAccordion='1';
      header.style.cursor='pointer';
      var open=true;
      header.addEventListener('click',function(){
        open=!open;
        body.style.display=open?'':'none';
        /* flip chevron if any */
        var svg=header.querySelector('svg');
        if(svg)svg.style.transform=open?'':'rotate(180deg)';
      });
    });
    /* 3. Scrollable content area — enable scroll inside iframe */
    var content=document.querySelector('#content,[id*="content"],[class*="content"],main');
    if(content){var cs=window.getComputedStyle(content);if(cs.overflow==='hidden'||cs.overflowY==='hidden'){content.style.overflowY='auto';}}
  }
  document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('img').forEach(function(img){if(img.src&&img.src.match(/^https?:\\/\\//)){img.onerror=function(){fixImg(this);};if(img.complete&&img.naturalWidth===0)fixImg(img);}else if(!img.src||img.src===''){fixImg(img);}});killPhoneChrome();fixPriceStyle();makeInteractive();setTimeout(function(){killPhoneChrome();fixPriceStyle();makeInteractive();},100);});
})();
<\/script>`

        finalHtml = finalHtml.replace(/<meta[^>]*name=["']viewport["'][^>]*>/gi, '')
        if (finalHtml.match(/<\/head>/i)) {
          finalHtml = finalHtml.replace(/<\/head>/i, dpReset + '</head>')
        } else if (finalHtml.includes('<head>')) {
          finalHtml = finalHtml.replace('<head>', '<head>' + dpReset)
        } else if (finalHtml.match(/<html[^>]*>/i)) {
          finalHtml = finalHtml.replace(/(<html[^>]*>)/i, '$1<head>' + dpReset + '</head>')
        } else {
          finalHtml = dpReset + finalHtml
        }
        ;(window as any).DPData.step6 = { html: finalHtml }
      } else if (step === 4) {
        const dirKey = chosenDirection || ((window as any).DPData.step4?.recommendation || {}).pick || 'B'
        const dirs = (window as any).DPData.step4?.directions || []
        const dir = dirs.find((d: any) => d.key === dirKey) || dirs[1] || {}
        const result = await aiJSON(`你是资深UX设计师。重新生成项目交付摘要，只返回JSON不加说明：
${brief}
诊断：${s2.diagnosis || ''}
选定方向：${dir.title || dirKey}—${dir.oneliner || ''}

{"background":"项目背景(2句)","diagnosis":"核心诊断(1-2句)","direction":"选定方向(1句)","decisions":["决策1(18字)","决策2","决策3","决策4","决策5"],"next":["建议1(18字)","建议2","建议3"],"files":[{"name":"01-竞品分析.md","type":"md","size":"18KB"},{"name":"02-设计分析.md","type":"md","size":"24KB"},{"name":"03-概念方向.pdf","type":"pdf","size":"1.4MB"},{"name":"04-高保真.html","type":"html","size":"210KB"},{"name":"05-交付摘要.md","type":"md","size":"12KB"}]}`)
        ;(window as any).DPData.step7 = { ...(window as any).DPData.step7, ...result }
      }
    } catch (e: any) {
      setProgressMsg(null)
      const isQuota = (e.code || '').includes('quota') || (e.message || '').includes('quota') || (e.message || '').includes('配额')
      if (isQuota) {
        setErrorMsg('__QUOTA__')
      } else {
        setErrorMsg(`AI 生成失败：${e.message || '网络错误，请检查代理服务是否运行'}`)
      }
    } finally {
      setProgressMsg(null)
      setGenLabel('')
      setRunningStep(null)
      setContentVersion(v => v + 1)
      ;(window as any).dpSaveWorkflowState({ currentStep, completedStep, chosenDirection }, projectId)
    }
  }

  const regenerate = async () => {
    if (runningStep !== null) return
    const genStep = currentStep! - 1
    if (genStep < 1) return
    await generateForStep(genStep)
  }

  const stepContent = (() => {
    switch (currentStep) {
      case 1: return <Step1 key={contentVersion} data={(window as any).DPData.step1 || {}} project={project} running={runningStep === 1} genLabel={genLabel} />
      case 2: return <Step2 key={contentVersion} data={(window as any).DPData.step2} running={runningStep === 2} genLabel={genLabel} />
      case 3: return <Step3 key={contentVersion} data4={(window as any).DPData.step4} chosen={chosenDirection} onChoose={setChosenDirection} running={runningStep === 2 || runningStep === 3} genLabel={genLabel} />
      case 4: return <Step6 key={contentVersion} project={project} running={runningStep === 3 || runningStep === 4} genLabel={genLabel} />
      case 5: return <Step7 key={contentVersion} data={(window as any).DPData.step7} project={project} direction={chosenDirection} />
      default: return null
    }
  })()

  return (
    <div data-screen-label={`Workflow · ${project.title}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      minWidth: 0,
    }}>
      {/* Top bar */}
      <div style={{
        height: 48, padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--bd-1)',
        flexShrink: 0, minWidth: 0,
        background: 'rgba(250,250,250,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', padding: '4px 10px 4px 6px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--tx-1)',
          fontFamily: 'inherit', borderRadius: 8, transition: 'background .15s',
          fontWeight: 600, letterSpacing: -0.01,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <Icon name="chevron-left" size={15} />
          <span style={{ color: 'var(--ac)' }}>D</span><span>esignpipe</span>
        </button>

        <Icon name="chevron-right" size={12} style={{ color: 'var(--tx-4)', flexShrink: 0 }} />

        <div style={{ fontSize: 13, color: 'var(--tx-2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.title}
        </div>

        <div style={{ flex: 1 }} />

        {runningStep !== null && (
          <div style={{
            fontSize: 11, color: 'var(--ac)',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', height: 26,
            background: 'var(--ac-soft)',
            border: '1px solid var(--ac-line)',
            borderRadius: 999,
          }}>
            <Spinner size={11} />
            <span className="mono" style={{ letterSpacing: 0.03 }}>AI 生成中</span>
          </div>
        )}

        <Btn variant="ghost" size="sm" icon="paperclip" title="添加附件" onClick={() => alert('附件功能开发中')} />
        <Btn variant="ghost" size="sm" icon="share" title="分享" onClick={() => alert('分享功能开发中')} />
        <Btn variant="ghost" size="sm" icon="download" title="下载" onClick={() => alert('下载功能开发中')} />
        <Btn variant={chatOpen ? 'soft' : 'ghost'} size="sm" icon="sparkles" onClick={() => setChatOpen(!chatOpen)}>AI 协作</Btn>
      </div>

      {/* 7-step horizontal strip */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--bd-1)',
        background: 'transparent',
        overflowX: 'auto',
        flexShrink: 0,
        maxHeight: pipelineHidden ? 0 : 64,
        opacity: pipelineHidden ? 0 : 1,
        transition: 'max-height .3s, opacity .3s, padding .3s',
        paddingTop: pipelineHidden ? 0 : 12,
        paddingBottom: pipelineHidden ? 0 : 12,
      }}>
        <div style={{ minWidth: 800 }}>
          <PipelineStrip
            steps={(window as any).DPData.steps}
            currentStep={currentStep!}
            completedStep={completedStep}
            onSelect={(idx: number) => {
              // Allow free navigation to any step that already has content, without regenerating
              const dp = (window as any).DPData
              const stepHasContent = (i: number) => {
                switch (i) {
                  case 1: return !!(dp.step1?.competitors?.length || dp.step1?.objective)
                  case 2: return !!dp.step2?.diagnosis
                  case 3: return !!(dp.step4?.directions?.length)
                  case 4: return !!dp.step6?.html
                  case 5: return !!(dp.step7?.background || dp.step7?.decisions?.length)
                  default: return false
                }
              }
              if (idx <= completedStep || idx === currentStep || stepHasContent(idx)) {
                setCurrentStep(idx)
                ;(window as any).dpSaveWorkflowState({ currentStep: idx, completedStep, chosenDirection }, projectId)
              }
            }}
          />
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: chatOpen ? '1fr 400px' : '1fr',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {/* Main column */}
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-0)', minWidth: 0 }}>
          {/* Step header */}
          <div style={{
            height: 48, padding: '0 24px',
            borderBottom: '1px solid var(--bd-1)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.95)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                height: 24, padding: '0 8px',
                background: 'var(--ac-soft)',
                border: '1px solid var(--ac-line)',
                borderRadius: 6,
                display: 'inline-flex', alignItems: 'center',
                flexShrink: 0,
              }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ac)', fontWeight: 700, letterSpacing: 0.04 }}>
                  {String(currentStep!).padStart(2, '0')} / 05
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.01 }}>
                {step.name}
              </span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--tx-4)', textTransform: 'uppercase', letterSpacing: 0.06, flexShrink: 0 }}>
                {step.en}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
              <Btn variant="ghost" size="sm" icon="regenerate" onClick={regenerate} disabled={runningStep === currentStep}>
                {runningStep === currentStep ? '生成中…' : '重新生成'}
              </Btn>
              <div style={{ width: 1, height: 16, background: 'var(--bd-1)', margin: '0 4px' }} />
              <Btn variant="ghost" size="sm" icon="external" title="单独打开" onClick={() => {
                const dp = (window as any).DPData
                // Step 4 = 高保真：直接打开 HTML 原型
                if (currentStep === 4 && dp.step6?.html) {
                  const blob = new Blob([dp.step6.html], { type: 'text/html;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  window.open(url, '_blank')
                  setTimeout(() => URL.revokeObjectURL(url), 60000)
                  return
                }
                // Step 3 = 概念·线框：打开选定方向的线框图
                if (currentStep === 3) {
                  const dirs = dp.step4?.directions || []
                  const dir = dirs.find((d: any) => d.key === chosenDirection) || dirs[0]
                  if (dir?.wireframeHTML) {
                    const blob = new Blob([dir.wireframeHTML], { type: 'text/html;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    window.open(url, '_blank')
                    setTimeout(() => URL.revokeObjectURL(url), 60000)
                    return
                  }
                }
                // 其他步骤：打开纯文字内容页
                const el = scrollRef.current
                const text = el ? el.innerText : '（暂无内容）'
                const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>${step.name} — ${project.title}</title><style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.7;color:#111}h1{font-size:20px;font-weight:600;margin-bottom:8px}pre{white-space:pre-wrap;font-size:14px}</style></head><body><h1>${step.name}</h1><p style="color:#999;font-size:13px;margin-bottom:24px">${project.title}</p><pre>${text}</pre></body></html>`
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                window.open(url, '_blank')
                setTimeout(() => URL.revokeObjectURL(url), 60000)
              }}>单独打开</Btn>
              <Btn variant="ghost" size="sm" icon="download" title="下载内容" onClick={() => {
                const el = scrollRef.current
                const text = el ? el.innerText : ''
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${step.name}.txt`
                a.click()
              }}>下载</Btn>
              <div style={{ width: 1, height: 16, background: 'var(--bd-1)', margin: '0 4px' }} />
              {currentStep === 3 ? (
                <Btn variant="primary" icon="check" iconRight="arrow-right" onClick={confirmStep} disabled={!chosenDirection || runningStep !== null} size="sm">
                  {runningStep !== null ? 'AI 生成中…' : chosenDirection ? `确认方向 ${chosenDirection}` : '请先选方向'}
                </Btn>
              ) : (
                <Btn variant="primary" iconRight="arrow-right" onClick={confirmStep} disabled={runningStep !== null} size="sm">
                  {runningStep !== null ? 'AI 生成中…' : currentStep === 5 ? '完成项目' : '确认并继续'}
                </Btn>
              )}
            </div>
          </div>

          {/* Progress banner */}
          {progressMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px',
              background: '#f0f7ff', borderBottom: '1px solid #bdd9f7',
              fontSize: 13, color: '#1a6fb5', flexShrink: 0,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ flex: 1 }}>{progressMsg}</span>
            </div>
          )}

          {/* Error banner */}
          {errorMsg && errorMsg === '__QUOTA__' ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px',
              background: '#fff8f0', borderBottom: '1.5px solid #f97316',
              fontSize: 13, color: '#c2410c', flexShrink: 0,
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ flex: 1 }}>
                <strong>API 配额不足</strong>，AI 调用失败。请前往 <a href="https://apiyi.com" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', fontWeight: 600 }}>apiyi.com</a> 充值后刷新页面重试。
              </span>
              <button onClick={() => setErrorMsg(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#f97316', padding: '2px 6px', fontSize: 16, lineHeight: 1,
              }}>✕</button>
            </div>
          ) : errorMsg ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px',
              background: '#fff2f2', borderBottom: '1px solid #ffd0d0',
              fontSize: 13, color: '#c0392b', flexShrink: 0,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ flex: 1 }}>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#c0392b', padding: '2px 6px', fontSize: 16, lineHeight: 1,
                borderRadius: 4, opacity: 0.7,
              }}>✕</button>
            </div>
          ) : null}

          {/* Step body */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 72px', minWidth: 0, background: 'var(--bg-1)' }}>
            {stepContent}
          </div>
        </main>

        {/* Right chat */}
        {chatOpen && (
          <aside style={{
            borderLeft: '1px solid var(--bd-1)',
            background: 'var(--bg-1)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <ChatPanel stepIdx={currentStep!} onRegenerate={regenerate} />
          </aside>
        )}
      </div>
    </div>
  )
}

export default Workflow
