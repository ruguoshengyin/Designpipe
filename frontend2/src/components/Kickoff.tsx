import React from 'react'
import { Icon, Btn, Badge, Spinner } from './ui'
import { buildQAContext } from '../utils/ai'

// ── Kickoff ───────────────────────────────────────────────────────────────────

interface KickoffProps {
  project: any
  onStart: (step: number) => void
  onBack?: () => void
}

export const Kickoff: React.FC<KickoffProps> = ({ project, onStart, onBack }) => {
  const [phase, setPhase] = React.useState('greeting')
  const [input, setInput] = React.useState('')
  const [thinking, setThinking] = React.useState(false)
  const [loadingMsg, setLoadingMsg] = React.useState('')
  const [projectBrief, setProjectBrief] = React.useState<any>(null)
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [pageImage, setPageImage] = React.useState<string | null>(null)
  const [questions, setQuestions] = React.useState<any[]>([])
  const [answers, setAnswers] = React.useState<Record<string, any>>({})
  const [apiError, setApiError] = React.useState<any>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const callAI = async (prompt: string) => {
    const res = await fetch('/api/proxy-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let full = '', buf = ''
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
            const err: any = new Error(msg)
            err.code = code
            throw err
          }
          full += content
        } catch (e: any) {
          if (e.code !== undefined) throw e
        }
      }
    }
    let t = full.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?```/g, '$1').trim()
    const start = t.indexOf('{'); const end = t.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      const raw = t.slice(start, end + 1).replace(/,(\s*[}\]])/g, '$1')
      try { return JSON.parse(raw) } catch {}
    }
    const m = full.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) } catch {} }
    throw new Error('No JSON in response')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.type.startsWith('image/') && !pageImage) {
        const reader = new FileReader()
        reader.onload = (ev) => setPageImage(ev.target!.result as string)
        reader.readAsDataURL(file)
      }
    })
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (idx: number) => {
    const file = attachments[idx]
    if (file && file.type.startsWith('image/')) setPageImage(null)
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  const handleGreetingSubmit = async () => {
    if (!input.trim() || thinking) return
    setThinking(true)

    setLoadingMsg('理解项目背景…')
    let brief: any = { product: input.slice(0, 24), targetUser: '目标用户', goal: '优化用户体验', context: '移动端应用' }
    try {
      const b = await callAI(
        `解析以下设计项目描述，只返回 JSON，不加任何说明：\n{"product":"产品名称15字内","targetUser":"目标用户20字内","goal":"核心设计目标25字内","context":"使用场景30字内"}\n描述：${input}`
      )
      if (b && b.product) { brief = b; setApiError(null) }
    } catch (e: any) {
      console.error('[Kickoff] brief 解析失败:', e)
      const isQuota = e.code === 'insufficient_quota' || (e.message || '').includes('配额')
      if (isQuota) {
        setApiError({ code: 'insufficient_quota', msg: e.message })
        setLoadingMsg(''); setThinking(false)
        return
      }
    }
    setProjectBrief({ userInput: input, ...brief })

    setLoadingMsg('推荐竞品…')
    let competitorOptions: string[] = []
    try {
      const cr = await callAI(
        `针对"${brief.product}"这个产品，列出 6 个最相关的竞品或参考产品（真实品牌/产品名），只返回 JSON：\n{"options":["名称1","名称2","名称3","名称4","名称5","名称6"]}\n只输出产品/品牌简称，不加说明。`
      )
      if (Array.isArray(cr.options) && cr.options.length) competitorOptions = cr.options.slice(0, 6)
    } catch (e: any) {
      console.warn('[Kickoff] 竞品推荐失败:', e.message)
    }

    setLoadingMsg('生成澄清问题…')
    let qs: any[] = []
    try {
      const q = await callAI(
        `你是 UX 设计顾问。针对以下项目，生成 3 个最能影响设计决策的澄清问题，只返回 JSON：\n{"questions":[{"id":"q1","question":"问题25字内","type":"choice","options":["选项A","选项B","选项C","不确定"]},{"id":"q2","question":"问题25字内","type":"choice","options":["选项A","选项B","选项C","无特殊要求"]},{"id":"q3","question":"问题25字内","type":"text","placeholder":"可选，输入或留空"}]}\nq1、q2 为单选，q3 为开放文本。\n项目：${brief.product}，目标：${brief.goal}，用户：${brief.targetUser}`
      )
      qs = Array.isArray(q.questions) ? q.questions : []
    } catch (e: any) {
      console.error('[Kickoff] 问题生成失败:', e)
    }

    const compCard = {
      id: 'competitors',
      question: '希望参考哪些竞品？（可多选）',
      type: 'multiselect',
      options: competitorOptions.length ? competitorOptions : ['闲鱼', '转转', '京东二手', '爱回收', '淘宝二手', '拍拍'],
    }
    const allQuestions = [compCard, ...qs]

    setQuestions(allQuestions)
    setAnswers({})
    setLoadingMsg('')
    setThinking(false)
    setPhase(allQuestions.length > 0 ? 'questioning' : 'confirming')
  }

  const handleQuestionsSubmit = () => {
    const qa = questions.map(q => {
      const raw = answers[q.id]
      let answer = ''
      if (Array.isArray(raw)) answer = raw.filter(Boolean).join('、')
      else answer = (raw || '').trim()
      return { question: q.question, answer }
    }).filter(item => item.answer)
    ;(window as any).DPData.qa = qa
    const compQ = questions.find(q => q.type === 'multiselect' && q.id === 'competitors')
    if (compQ) {
      const chosen = answers['competitors']
      if (Array.isArray(chosen) && chosen.length) {
        ;(window as any).DPData.chosenCompetitors = chosen
      }
    }
    setPhase('confirming')
  }

  const handleConfirm = async (startStep: number) => {
    setThinking(true)
    setLoadingMsg(startStep === 3 ? 'AI 正在准备数据…（约 10 秒）' : 'AI 正在生成竞品分析…')

    try {
      // Safe clear — function may not exist in all environments
      ;(window as any).dpClearCache?.()

      const dpData = (window as any).DPData
      dpData.step2 = {}
      dpData.step3 = {}
      dpData.step4 = { directions: [], recommendation: {} }
      dpData.step5 = {}
      dpData.step6 = null
      dpData.step7 = {}
      dpData.uploadedImage = null
      dpData.pageType = null

      const userStep1Base = {
        objective: `围绕「${projectBrief?.product || input}」${projectBrief?.goal || '提升用户体验'}`,
        focus: [projectBrief?.goal || '用户体验优化', '信息架构', '交互流程', '视觉还原', '可用性'],
        competitors: [],
        inputs: [
          `产品：${projectBrief?.product || input}`,
          `目标用户：${projectBrief?.targetUser || ''}`,
          `核心目标：${projectBrief?.goal || ''}`,
          `使用场景：${projectBrief?.context || ''}`,
        ].filter(s => s.trim().length > 4),
      }
      dpData.step1 = userStep1Base

      try {
        const step1 = await callAI(
          `你是资深 UX 设计师，为以下项目生成竞品分析报告，只返回 JSON，不加任何说明：
{
  "objective": "本次分析目标（一句话，30字内）",
  "focus": ["分析焦点1（15字内）","分析焦点2","分析焦点3","分析焦点4","分析焦点5"],
  "competitors": [
    {"name":"竞品1","url":"https://","observation":"关键观察（35字内）","usable":"可借鉴（18字内）","avoid":"不照搬（18字内）","impact":"影响后续步骤（18字内）"},
    {"name":"竞品2","url":"https://","observation":"...","usable":"...","avoid":"...","impact":"..."},
    {"name":"竞品3","url":"https://","observation":"...","usable":"...","avoid":"...","impact":"..."},
    {"name":"竞品4","url":"https://","observation":"...","usable":"...","avoid":"...","impact":"..."}
  ],
  "inputs": ["设计输入1（20字内）","设计输入2","设计输入3","设计输入4","设计输入5"]
}

产品：${projectBrief?.product || input}
目标：${projectBrief?.goal || ''}
用户：${projectBrief?.targetUser || ''}
场景：${projectBrief?.context || ''}${
  (dpData.chosenCompetitors || []).length
    ? `\n重点分析以下竞品（用户指定）：${dpData.chosenCompetitors.join('、')}`
    : ''
}${buildQAContext()}`
        )
        dpData.step1 = step1
      } catch (e) {
        console.warn('step1 AI 生成失败，使用用户输入作为基础数据', e)
      }
      if (pageImage) dpData.uploadedImage = pageImage

      if (startStep === 3) {
        try {
          setLoadingMsg('AI 正在生成设计分析…（2/3）')
          const s1 = dpData.step1 || {}
          const briefStr = `分析目标：${s1.objective || ''}\n设计输入：${(s1.inputs || []).slice(0, 3).join('；')}`
          const step2 = await callAI(`你是资深UX设计师。生成设计分析，只返回JSON不加说明：
${briefStr}
{"diagnosis":"核心问题2句","opportunities":[{"p":"P0","name":"机会1","why":"15字","impact":"10字"},{"p":"P0","name":"机会2","why":"15字","impact":"10字"},{"p":"P1","name":"机会3","why":"15字","impact":"10字"}],"principles":["原则1","原则2","原则3"]}`)
          dpData.step2 = step2

          setLoadingMsg('AI 正在生成概念方向…（3/3）')
          const s2 = step2 || {}
          const opps = (s2.opportunities || []).map((o: any) => `${o.p} ${o.name}`).join('；')
          const pageType = pageImage ? '移动端页面' : (s1.objective || '移动端页面').substring(0, 20)
          dpData.pageType = pageType
          const step4 = await callAI(`你是资深UX设计师。生成3个差异化概念方向，只返回JSON不加说明：
诊断：${s2.diagnosis || ''}
机会点：${opps}
页面类型：${pageType}
${briefStr}
{"directions":[{"key":"A","title":"方向名(4字)","subtitle":"定位(12字)","oneliner":"策略(30字)","moves":["动作1","动作2","动作3"],"advantage":"优势","tradeoff":"代价","cost":"low","impact":"影响","cite":"对应机会"},{"key":"B","title":"...","subtitle":"...","oneliner":"...","moves":["...","...","..."],"advantage":"...","tradeoff":"...","cost":"med","impact":"...","cite":"...","recommended":true},{"key":"C","title":"...","subtitle":"...","oneliner":"...","moves":["...","...","..."],"advantage":"...","tradeoff":"...","cost":"high","impact":"...","cite":"..."}],"recommendation":{"pick":"B","reason":"推荐理由"}}`)
          dpData.step4 = { ...dpData.step4, ...step4 }
        } catch (e) {
          console.warn('跳步生成失败，请通过完整流程生成', e)
        }
      }

      ;(window as any).dpSaveCache?.()
      dpData._lastBrief = projectBrief
      onStart(startStep)
    } catch (e) {
      console.error('handleConfirm failed:', e)
    } finally {
      // Always reset loading state, even if an error occurred mid-way
      setLoadingMsg('')
      setThinking(false)
    }
  }

  const suggestions = [
    '优化转转 iPhone 15 搜索结果页',
    '重新设计 SaaS 产品的新用户引导流程',
    '改进数字银行 App 的转账体验',
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-0)',
    }}>
      {/* Top bar */}
      <div style={{
        height: 56, padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--bd-1)',
        flexShrink: 0,
        background: 'var(--bg-0)',
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', padding: '4px 10px 4px 6px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--tx-1)',
            fontFamily: 'inherit', borderRadius: 8, transition: 'background .15s',
            fontWeight: 600, letterSpacing: -0.01, flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Icon name="chevron-left" size={15} />
            <span style={{ color: 'var(--ac)' }}>D</span><span>esignpipe</span>
          </button>
        )}
        {onBack && <Icon name="chevron-right" size={12} style={{ color: 'var(--tx-4)', flexShrink: 0 }} />}
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${project.color || '#cc785c'} 0%, color-mix(in srgb, ${project.color || '#cc785c'} 80%, #000) 100%)`,
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {phase === 'greeting' ? '新项目' : (projectBrief?.product || project.title)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx-4)' }}>{project.product || 'Designpipe 工作流'}</div>
        </div>
        <Badge tone="default">准备中</Badge>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 680, width: '100%' }}>

          {/* API quota error banner */}
          {apiError && (
            <div style={{
              marginBottom: 20,
              padding: '14px 18px',
              background: '#fff8f0',
              border: '1.5px solid #f97316',
              borderRadius: 12,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#c2410c', marginBottom: 4 }}>
                  API 配额不足，无法调用 AI
                </div>
                <div style={{ fontSize: 12.5, color: '#9a3412', lineHeight: 1.6 }}>
                  请前往 <strong>apiyi.com</strong> 充值后刷新页面重试。
                  {apiError.msg && <span style={{ color: '#ea580c' }}> （{apiError.msg}）</span>}
                </div>
              </div>
              <button onClick={() => setApiError(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#f97316', fontSize: 16, padding: 2, lineHeight: 1, flexShrink: 0,
              }}>✕</button>
            </div>
          )}

          {/* Greeting phase */}
          {phase === 'greeting' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'var(--ac-soft)', color: 'var(--ac)',
                  border: '2px solid var(--ac-line)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon name="sparkles" size={26} stroke={2} />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 8px 0', color: 'var(--tx-1)', letterSpacing: -0.02 }}>
                  你好，我是 Designpipe
                </h1>
                <p style={{ fontSize: 15, color: 'var(--tx-3)', lineHeight: 1.6, margin: 0 }}>
                  我会陪你走完 UX 设计的完整流程。
                  <br />
                  <strong style={{ color: 'var(--tx-2)' }}>先说说你要做什么项目吧？</strong>
                </p>
              </div>

              <div style={{
                padding: '14px 18px',
                background: 'var(--bg-1)',
                border: '1.5px solid var(--bd-1)',
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <textarea
                  placeholder="例如：优化转转 App 的 iPhone 15 搜索结果页，提升用户信任和转化率…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGreetingSubmit() }}
                  style={{
                    width: '100%',
                    minHeight: 100,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--tx-1)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: 1.6,
                  }}
                />

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd-1)' }}>
                    {attachments.map((file, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: file.type.startsWith('image/') ? '4px 8px 4px 4px' : '6px 10px',
                        background: 'var(--bg-2)',
                        border: '1px solid var(--bd-1)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}>
                        {file.type.startsWith('image/') && pageImage ? (
                          <img src={pageImage} alt={file.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                        ) : (
                          <Icon name="paperclip" size={12} style={{ color: 'var(--tx-3)' }} />
                        )}
                        <span style={{ color: 'var(--tx-2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <button onClick={() => removeAttachment(i)} style={{
                          background: 'none', border: 'none', padding: 2, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', color: 'var(--tx-4)',
                        }}>
                          <Icon name="x" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <button onClick={() => fileInputRef.current?.click()} style={{
                      background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 12, color: 'var(--tx-3)',
                      fontFamily: 'inherit', borderRadius: 6,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Icon name="paperclip" size={14} />
                      <span>添加附件</span>
                    </button>
                    <span style={{ fontSize: 11.5, color: 'var(--tx-4)' }}>⌘ + Enter 发送</span>
                  </div>
                  <button onClick={handleGreetingSubmit} disabled={!input.trim() || thinking} style={{
                    padding: '8px 18px',
                    background: (input.trim() && !thinking) ? 'var(--ac)' : 'var(--bg-3)',
                    color: (input.trim() && !thinking) ? '#fff' : 'var(--tx-4)',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: (input.trim() && !thinking) ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {thinking ? <><Spinner size={14} /> 思考中…</> : <>开始 <Icon name="arrow-right" size={14} /></>}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} style={{
                    fontSize: 12, padding: '6px 12px', borderRadius: 999,
                    border: '1px solid var(--bd-1)', background: 'var(--bg-1)',
                    color: 'var(--tx-2)', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac-line)'; e.currentTarget.style.background = 'var(--ac-soft)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-1)'; e.currentTarget.style.background = 'var(--bg-1)' }}
                  >{s}</button>
                ))}
              </div>
            </>
          )}

          {/* Questioning phase */}
          {phase === 'questioning' && questions.length > 0 && (
            <>
              <div style={{
                display: 'flex', gap: 12, marginBottom: 24,
                padding: '16px 20px',
                background: 'var(--bg-1)',
                border: '1px solid var(--bd-1)',
                borderRadius: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'var(--ac-soft)', color: 'var(--ac)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="sparkles" size={16} />
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--tx-2)', lineHeight: 1.6, paddingTop: 4 }}>
                  我理解了你的项目。为了让设计更贴合你的需求，请回答以下问题（可跳过）：
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {questions.map((q: any, i: number) => (
                  <div key={q.id} style={{
                    padding: '18px 20px',
                    background: 'var(--bg-1)',
                    border: '1.5px solid var(--bd-1)',
                    borderRadius: 12,
                  }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 12 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 20, height: 20, borderRadius: 6,
                        background: 'var(--ac)', color: '#fff',
                        fontSize: 11, fontWeight: 700,
                        marginRight: 8, flexShrink: 0,
                      }}>{i + 1}</span>
                      {q.question}
                    </div>

                    {q.type === 'multiselect' && Array.isArray(q.options) ? (
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--tx-4)', marginBottom: 8 }}>可多选</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {q.options.map((opt: string, oi: number) => {
                            const sel = Array.isArray(answers[q.id]) ? answers[q.id] : []
                            const selected = sel.includes(opt)
                            return (
                              <button key={oi} onClick={() => setAnswers(prev => {
                                const cur = Array.isArray(prev[q.id]) ? prev[q.id] : []
                                return { ...prev, [q.id]: selected ? cur.filter((x: string) => x !== opt) : [...cur, opt] }
                              })} style={{
                                padding: '7px 14px',
                                borderRadius: 999,
                                border: selected ? '1.5px solid var(--ac)' : '1.5px solid var(--bd-1)',
                                background: selected ? 'var(--ac-soft)' : 'var(--bg-2)',
                                color: selected ? 'var(--ac)' : 'var(--tx-2)',
                                fontSize: 12.5,
                                fontWeight: selected ? 600 : 400,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all .15s',
                                display: 'flex', alignItems: 'center', gap: 5,
                              }}>
                                {selected && <span style={{ fontSize: 11, lineHeight: 1 }}>✓</span>}
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : q.type === 'choice' && Array.isArray(q.options) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {q.options.map((opt: string, oi: number) => {
                          const selected = answers[q.id] === opt
                          return (
                            <button key={oi} onClick={() => setAnswers(prev => ({
                              ...prev,
                              [q.id]: selected ? '' : opt,
                            }))} style={{
                              padding: '7px 14px',
                              borderRadius: 999,
                              border: selected ? '1.5px solid var(--ac)' : '1.5px solid var(--bd-1)',
                              background: selected ? 'var(--ac-soft)' : 'var(--bg-2)',
                              color: selected ? 'var(--ac)' : 'var(--tx-2)',
                              fontSize: 12.5,
                              fontWeight: selected ? 600 : 400,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all .15s',
                            }}>{opt}</button>
                          )
                        })}
                      </div>
                    ) : (
                      <textarea
                        placeholder={q.placeholder || '请输入…（可选）'}
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        style={{
                          width: '100%', minHeight: 72,
                          background: 'var(--bg-2)',
                          border: '1px solid var(--bd-1)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          outline: 'none',
                          color: 'var(--tx-1)',
                          fontSize: 13,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          lineHeight: 1.6,
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { (window as any).DPData.qa = []; setPhase('confirming') }} style={{
                  padding: '9px 18px',
                  background: 'none',
                  border: '1px solid var(--bd-1)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--tx-3)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>跳过问题</button>
                <button onClick={handleQuestionsSubmit} style={{
                  padding: '9px 20px',
                  background: 'var(--ac)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  继续 <Icon name="arrow-right" size={14} />
                </button>
              </div>
            </>
          )}

          {/* Confirming phase */}
          {phase === 'confirming' && projectBrief && (
            <>
              <div style={{
                padding: '20px 24px',
                background: 'var(--bg-1)',
                border: '1px solid var(--bd-1)',
                borderRadius: 12,
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'var(--ac-soft)', color: 'var(--ac)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name="sparkles" size={14} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)' }}>
                    好的，我理解了你的项目：
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: '产品', value: projectBrief.product },
                    { label: '目标', value: projectBrief.goal },
                    { label: '背景', value: projectBrief.context },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{
                        fontSize: 11.5, fontWeight: 600, color: 'var(--tx-4)',
                        width: 28, flexShrink: 0, letterSpacing: 0.2,
                      }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.5 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {((window as any).DPData?.qa || []).length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bd-1)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-4)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>
                      你的补充信息
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {((window as any).DPData.qa || []).map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.5, flex: '0 0 auto', maxWidth: 200 }}>{item.question}</span>
                          <span style={{ fontSize: 11.5, color: 'var(--tx-4)' }}>·</span>
                          <span style={{ fontSize: 12.5, color: 'var(--tx-1)', fontWeight: 500, lineHeight: 1.5 }}>{item.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 12 }}>
                  我推荐这样开始：
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <button onClick={() => handleConfirm(1)} disabled={thinking} style={{
                    padding: '16px 20px',
                    background: 'var(--bg-1)',
                    border: '1.5px solid var(--bd-1)',
                    borderRadius: 12,
                    textAlign: 'left',
                    cursor: thinking ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { if (!thinking) { e.currentTarget.style.borderColor = 'var(--ac)'; e.currentTarget.style.background = 'var(--ac-soft)' } }}
                  onMouseLeave={e => { if (!thinking) { e.currentTarget.style.borderColor = 'var(--bd-1)'; e.currentTarget.style.background = 'var(--bg-1)' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Badge tone="accent">推荐</Badge>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)' }}>
                        完整 5 步流程
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1.5 }}>
                      从竞品分析开始 → 设计分析 → 概念方向 + 线框图 → 高保真 → 交付文档
                    </div>
                  </button>

                  <button onClick={() => handleConfirm(3)} disabled={thinking} style={{
                    padding: '14px 18px',
                    background: 'var(--bg-1)',
                    border: '1px solid var(--bd-1)',
                    borderRadius: 10,
                    textAlign: 'left',
                    cursor: thinking ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { if (!thinking) { e.currentTarget.style.borderColor = 'var(--bd-2)'; e.currentTarget.style.background = 'var(--bg-2)' } }}
                  onMouseLeave={e => { if (!thinking) { e.currentTarget.style.borderColor = 'var(--bd-1)'; e.currentTarget.style.background = 'var(--bg-1)' } }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--tx-1)', marginBottom: 3 }}>
                      或者：从线框图开始
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>
                      跳过前期分析，直接进入设计产出阶段
                    </div>
                  </button>
                </div>
              </div>

              {thinking && (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--ac-soft)',
                  border: '1px solid var(--ac-line)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: 'var(--ac)',
                  fontSize: 13,
                }}>
                  <Spinner size={16} />
                  <span className="pulse">{loadingMsg || '正在启动工作流…'}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Kickoff
