import React from 'react'
import { Icon, Btn, Spinner } from './ui'
import { useTypewriter } from './ui'

// ── DPChatSuggestions ─────────────────────────────────────────────────────────

export const DPChatSuggestions: Record<number | string, string[]> = {
  1: ["补充一个海外二手平台", "把闲鱼的观察讲深一点", "重点改成中老年用户视角"],
  2: ["再加 1 条 P0 机会", "JTBD 改成首次购买者", "决策模型展开成 6 步"],
  3: ["增加客服兜底分支", "节点改成 12 个", "用通用风格颜色"],
  4: ["改成深色模式", "卡片间距调宽松一些", "导航栏加搜索框", "把价格字号调大"],
  5: ["把对比抽屉做成第二屏", "增加空状态线框", "标注改 7 条"],
  6: ["生成 PRD 提纲", "导出为 Notion", "附上埋点表"],
  default: ["重新生成", "更精炼", "更详细"],
}

export const DPChatReplies: Record<number | string, string[]> = {
  1: [
    "已新增「Mercari（日本二手）」竞品观察：日本市场对机况描述的标准化做了 6 等级强约束，可作为 Step 2 决策模型的参考。要不要我同步更新「设计输入清单」？",
    "我已重写「闲鱼」段落，强化了它在「鱼小铺/官方认证」标签前置和「客服兜底」两个观察上的细节。新版已写入。",
  ],
  2: [
    "已新增 P0 机会「价格异常预警（明显低于市场价时显示警示）」，理由：C2C 二手最大的次级风险是「太便宜的反而不敢买」，这点在 Step 1 闲鱼观察中也有印证。",
    "JTBD 已改为首次购买者视角：核心 Job 从「比价」改为「确认我买的不是坑」。情感 Job 强化「踏实」。",
  ],
  3: [
    "已为流程图新增「客服兜底」分支：用户在保障校验失败时可直达「问客服」，命中即认为高保障，回到对比环节。",
    "节点已扩展到 12 个，新增「关键词扩展（搜 iPhone15 自动联想 Pro/Plus）」「价格异常二次确认」「对比抽屉容量上限」三个节点。",
  ],
  4: [
    "已新增方向 D「社交推荐增强」：核心是引入「认识的人买过」「朋友收藏过」社交锚点。优点：差异化强；缺点：依赖社交图谱。已作为草稿放在方向区下方。",
    "已把方向 B 拆为 B1（保障锚点）和 B2（智能排序），B1 可独立 V1，B2 留到 V1.5。推荐也已同步更新。",
  ],
  5: [
    "已在第二屏新增「对比抽屉详细页」线框，包含 3 件商品横向比对表。标注共 8 条，覆盖入口、状态、空态。",
    "新增「无结果空状态」线框：默认显示放宽筛选建议 + 客服兜底入口。",
  ],
  6: [
    "已切换到深色版本，主色保持转转红，背景调整为 #15161A。卡片间距按舒适密度重新排版。",
    "已生成 V2 高保真：在 V1 基础上把对比抽屉做到全量上线状态。可在版本历史中切换查看。",
  ],
  7: [
    "PRD 提纲已生成，分为：背景 / 目标 / 范围 / 关键决策 / 实现优先级 / 埋点 / 风险预案，共 7 个章节。已挂在文件索引下。",
    "埋点表已生成，共 14 个事件，覆盖 filter / card / trust / compare 四组。已写入交付包。",
  ],
  default: [
    "我已据你说的重新生成。新版本已在中间面板更新，旧版本可通过右上角的版本历史回滚。",
    "改好了。重点改动：调整了核心字段顺序，并把次要信息收到第二层。",
  ],
}

// Expose to window for compatibility
if (typeof window !== 'undefined') {
  (window as any).DPChatSuggestions = DPChatSuggestions
  ;(window as any).DPChatReplies = DPChatReplies
}

// ── Message ───────────────────────────────────────────────────────────────────

interface MessageProps {
  m: any
}

const Message: React.FC<MessageProps> = ({ m }) => {
  const isUser = m.role === 'user'
  const isAI = m.role === 'ai'
  const { shown, done } = useTypewriter(m.text, { enabled: m.typing, speed: 14 })
  const display = m.typing ? shown : m.text
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }} className="fadeUp">
      {!isUser && (
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: isAI ? 'var(--ac-soft)' : 'var(--bg-2)',
          color: isAI ? 'var(--ac)' : 'var(--tx-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name={isAI ? 'sparkles' : 'info'} size={12} /></div>
      )}
      <div style={{
        flex: 1, minWidth: 0,
        background: isUser ? 'var(--ac-soft)' : 'transparent',
        border: isUser ? '1px solid var(--ac-line)' : 'none',
        borderRadius: 10, padding: isUser ? '8px 12px' : 0,
        marginLeft: isUser ? 28 : 0,
        fontSize: 12.5, color: isUser ? 'var(--tx-1)' : 'var(--tx-2)', lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
      }}
      className={m.typing && !done ? 'tcursor' : ''}
      >
        {display}
      </div>
      {isUser && (
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: 'var(--bg-3)', color: 'var(--tx-2)', fontSize: 10, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>你</div>
      )}
    </div>
  )
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  stepIdx: number
  onRegenerate: () => void
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ stepIdx, onRegenerate }) => {
  const stepName = (window as any).DPData?.steps?.[stepIdx - 1]?.name ?? ''
  const isHiFiStep = stepIdx === 4

  const [messages, setMessages] = React.useState<any[]>([
    {
      role: 'system',
      text: isHiFiStep
        ? `高保真设计模式已开启。你可以直接描述想要的修改，例如「改成深色模式」「把按钮颜色换成橙色」——AI 会直接更新设计预览。`
        : `已切换到 Step 0${stepIdx}「${stepName}」。需要我改什么？`,
    },
  ])
  const [input, setInput] = React.useState('')
  const [thinking, setThinking] = React.useState(false)

  React.useEffect(() => {
    setMessages([
      {
        role: 'system',
        text: stepIdx === 4
          ? `高保真设计模式已开启。你可以直接描述想要的修改，例如「改成深色模式」「把按钮颜色换成橙色」——AI 会直接更新设计预览。`
          : `已切换到 Step 0${stepIdx}「${stepName}」。需要我改什么？`,
      },
    ])
    setInput('')
  }, [stepIdx, stepName])

  const send = async () => {
    if (!input.trim() || thinking) return
    const userMsg = { role: 'user', text: input }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setThinking(true)

    const stepDesc = (window as any).DPData?.steps?.[stepIdx - 1]?.desc || ''

    let systemPrompt: string
    if (isHiFiStep && (window as any).DPData?.step6?.html) {
      const currentHtml = (window as any).DPData.step6.html
      const htmlSnippet = currentHtml.length > 12000
        ? currentHtml.substring(0, 12000) + '\n<!-- ...truncated... -->'
        : currentHtml
      systemPrompt = `你是 Designpipe 的 AI 设计调整助手，专门服务于转转（二手电商平台）高保真设计稿。

${(window as any).DPDesignSpec}

当前高保真 HTML：
\`\`\`html
${htmlSnippet}
\`\`\`

用户请求视觉/内容修改时（严格按此顺序输出）：
1. 先用一句话（≤30字）说明你将怎么改
2. 紧接着返回**整页完整**的修改后 HTML，用 \`\`\`html ... \`\`\` 包裹，从 <!DOCTYPE html> 开始到 </html> 结束
3. 代码块之后不要再写任何文字
4. 必须返回整页（不是片段、不是 diff），并保留顶部 status-bar（44px）与 nav-bar
5. 严格遵守上方转转设计系统规范，不得使用规范外的颜色或字体

用户只是提问或讨论（不涉及改设计）时：直接用中文回答，不返回任何 HTML 代码。`
    } else {
      systemPrompt = `你是 Designpipe 的 AI 设计协作助手，正协助完成转转（二手电商平台）的 UX 设计工作流。当前步骤：Step 0${stepIdx}「${stepName}」——${stepDesc}。请根据用户问题给出专业、简洁的设计建议，回复中文，控制在 300 字以内。`
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
    ]

    try {
      const res = await fetch('/api/proxy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, ...(isHiFiStep ? { max_tokens: 16000 } : {}) }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setThinking(false)
      setMessages(m => [...m, { role: 'ai', text: '', streaming: true }])

      const looksLikeCode = (t: string) => (
        /```|<!doctype|<html|<head|<body|<style|<div|<section|<button|<span|<input|<img|<svg|<nav|<ul|<li/i.test(t)
        || /\{[^{}]*:[^{}]*;/.test(t)
      )

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let aiText = ''
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()!
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const chunk = line.slice(6)
          if (chunk === '[DONE]') break
          try {
            const parsed = JSON.parse(chunk)
            aiText += parsed.content || ''
            const live = aiText
            setMessages(m => m.map((msg, i) => {
              if (i !== m.length - 1) return msg
              let disp = live
              if (isHiFiStep && looksLikeCode(live)) {
                disp = '⏳ 正在生成新的设计，请稍候…（结果会直接更新左侧预览）'
              }
              return { ...msg, text: disp }
            }))
          } catch (_) {}
        }
      }
      setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, streaming: false } : msg))

      // After streaming: check if AI returned HTML for hi-fi update
      if (isHiFiStep) {
        const extractHtml = (text: string) => {
          let m = text.match(/```html\s*([\s\S]*?)```/i)
          if (m && m[1].trim().length > 200) return m[1].trim()
          const m2 = text.match(/<!DOCTYPE[\s\S]*<\/html>/i) || text.match(/<html[\s\S]*<\/html>/i)
          if (m2) return m2[0].trim()
          let start = text.search(/<!DOCTYPE/i)
          if (start === -1) start = text.search(/<html[\s>]/i)
          if (start === -1) { const f = text.search(/```html/i); if (f !== -1) start = f }
          if (start !== -1) {
            let html = text.slice(start)
              .replace(/```html\s*/i, '')
              .replace(/```\s*$/i, '')
              .trim()
            if (html.length < 200) return null
            if (!/<\/body>/i.test(html)) html += '\n</body>'
            if (!/<\/html>/i.test(html)) html += '\n</html>'
            return html
          }
          return null
        }
        const rawHtml = extractHtml(aiText)
        if (rawHtml) {
          try {
            const processed = (window as any).DPPostProcessHtml?.(rawHtml) ?? rawHtml
            ;(window as any).DPData.step6 = { html: processed }
            window.dispatchEvent(new CustomEvent('updateContent'))
            let cut = aiText.search(/```html|<!DOCTYPE|<html[\s>]/i)
            let explanation = (cut !== -1 ? aiText.slice(0, cut) : aiText)
              .replace(/```html?\s*$/i, '').trim()
            setMessages(m => m.map((msg, i) => i === m.length - 1
              ? { ...msg, text: (explanation || '已按你的要求更新设计。') + '\n\n✅ 左侧预览已刷新', streaming: false, htmlApplied: true }
              : msg
            ))
          } catch (e) {
            console.error('Chat HTML apply error:', e)
            setMessages(m => m.map((msg, i) => i === m.length - 1
              ? { ...msg, text: '⚠️ 更新预览时出错了，请重试或换一种说法。', streaming: false }
              : msg
            ))
          }
        } else if (looksLikeCode(aiText)) {
          setMessages(m => m.map((msg, i) => i === m.length - 1
            ? { ...msg, text: '⚠️ 这次没能生成完整页面（可能被截断），请再说一次，或把需求拆小一点重试。', streaming: false }
            : msg
          ))
        }
      }

    } catch (err) {
      setThinking(false)
      setMessages(m => [...m, { role: 'ai', text: '⚠️ 无法连接 AI 服务，请确认 Designpipe 后端正在运行（端口 8000）。' }])
    }
  }

  const suggestions = (DPChatSuggestions as any)[stepIdx] || DPChatSuggestions.default

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--bd-1)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: 'var(--ac-soft)', color: 'var(--ac)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="sparkles" size={14} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {isHiFiStep ? '设计调整模式' : `AI 协作 · Step 0${stepIdx}`}
            {isHiFiStep && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 500,
                padding: '1px 6px', borderRadius: 4,
                background: 'var(--ac-soft)', color: 'var(--ac)',
              }}>实时更新</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--tx-4)' }}>
            {isHiFiStep ? '描述修改需求，AI 直接更新高保真预览' : '对当前步骤改写、补充、追问'}
          </div>
        </div>
        <Btn variant="ghost" size="sm" icon="regenerate" onClick={onRegenerate} title="重新生成本步骤">重生</Btn>
        <Btn variant="ghost" size="sm" icon="x" onClick={() => window.dispatchEvent(new CustomEvent('closeChat'))} title="关闭" />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => <Message key={i} m={m} />)}
        {thinking && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--tx-3)', fontSize: 12 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, background: 'var(--ac-soft)', color: 'var(--ac)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><Icon name="sparkles" size={12} /></div>
            <div className="pulse">思考中…</div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {suggestions.map((s: string, i: number) => (
          <button key={i} onClick={() => setInput(s)} style={{
            fontSize: 11.5, padding: '5px 10px', borderRadius: 999,
            border: '1px solid var(--bd-1)', background: 'var(--bg-1)',
            color: 'var(--tx-2)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac-line)'; e.currentTarget.style.color = 'var(--ac)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-1)'; e.currentTarget.style.color = 'var(--tx-2)' }}
          >{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        margin: '0 12px 12px', padding: '10px 12px',
        background: 'var(--bg-2)', border: '1px solid var(--bd-1)',
        borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() } }}
          placeholder="让 AI 改写 / 补充 / 重生成…  ⌘ + ↵ 发送"
          rows={2}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            resize: 'none', color: 'var(--tx-1)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Btn variant="ghost" size="sm" icon="attach" title="附加文件" />
          <Btn variant="ghost" size="sm" icon="wand" title="改写">改写</Btn>
          <div style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--tx-4)' }}>Claude · Haiku 4.5</span>
          <Btn variant="primary" size="sm" icon="send" onClick={send} disabled={!input.trim()}>发送</Btn>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
