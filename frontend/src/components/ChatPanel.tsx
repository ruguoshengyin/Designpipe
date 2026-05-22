import { useRef, useState, useEffect } from "react";
import { useProjectStore } from "../stores/project";
import { streamChat } from "../api/client";
import type { ChatMessage } from "../types";

interface Props {
  step: number;
}

const STEP_SYSTEM_PROMPTS: Record<number, string> = {
  1: "你是一位资深 UX 研究员，正在协助分析竞品。请基于已有的竞品分析，回答用户的追问，提供专业的设计洞察。",
  2: "你是一位设计策略师，正在协助进行设计诊断。请基于已有的分析结果，帮助用户深入理解设计问题和机会点。",
  3: "你是一位 UX 设计师，正在协助探讨设计方向。请帮助用户理解三个设计方向的差异，提供选择建议。",
  5: "你是一位设计负责人，正在协助完善交付文档。请帮助用户补充细节或调整文档内容。",
};

const S: Record<string, React.CSSProperties> = {
  panel: { display: "flex", flexDirection: "column", height: "100%", padding: "12px 16px" },
  header: { fontSize: 12, color: "#AAA", marginBottom: 8, fontWeight: 600 },
  history: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 },
  userMsg: {
    alignSelf: "flex-end", background: "#FF0F27", color: "#fff",
    borderRadius: "12px 12px 2px 12px", padding: "7px 12px", fontSize: 13, maxWidth: "70%",
  },
  assistantMsg: {
    alignSelf: "flex-start", background: "#F5F5F5", color: "#111",
    borderRadius: "12px 12px 12px 2px", padding: "7px 12px", fontSize: 13, maxWidth: "75%",
    whiteSpace: "pre-wrap", lineHeight: 1.5,
  },
  inputRow: { display: "flex", gap: 8 },
  input: {
    flex: 1, border: "1px solid #E0E0E0", borderRadius: 8,
    padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit",
  },
  sendBtn: {
    background: "#FF0F27", color: "#fff", border: "none",
    borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
    flexShrink: 0,
  },
  step4Banner: {
    background: "#FFF3E0", borderRadius: 8, padding: "6px 12px",
    fontSize: 12, color: "#E65100", marginBottom: 8,
  },
};

export default function ChatPanel({ step }: Props) {
  const { activeProject, chatHistory, appendChat, streaming, setStreaming, designSpec, steps } =
    useProjectStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const history = chatHistory[step] ?? [];
  const isStep4 = step === 4;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function buildMessages(): ChatMessage[] {
    const msgs: ChatMessage[] = [];

    if (isStep4) {
      // Design adjustment mode: inject current HTML into system prompt
      const currentHtml = steps[4]?.content ?? "";
      const systemContent = `你是转转 App 高级 UI 工程师。用户正在调整当前高保真设计稿。

当前 HTML 原型（用户可能要求你基于它修改）：
\`\`\`html
${currentHtml.slice(0, 6000)}
\`\`\`

设计系统规范摘要：
${designSpec.slice(0, 1000)}

如需输出修改后的 HTML，请用 \`\`\`html ... \`\`\` 包裹。`;
      msgs.push({ role: "system", content: systemContent });
    } else {
      const sys = STEP_SYSTEM_PROMPTS[step];
      if (sys) msgs.push({ role: "system", content: sys });
    }

    // add history
    for (const m of history) {
      if (m.role !== "system") msgs.push(m);
    }

    // add current input
    msgs.push({ role: "user", content: input.trim() });
    return msgs;
  }

  async function send() {
    if (!input.trim() || streaming || !activeProject) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    appendChat(step, userMsg);
    setInput("");
    setStreaming(true);

    let buffer = "";
    const tempMsg: ChatMessage = { role: "assistant", content: "" };
    appendChat(step, tempMsg);

    const messages = buildMessages();

    abortRef.current = streamChat(
      { project_id: activeProject.id, step, messages },
      (delta) => {
        buffer += delta;
        // update last assistant message in place
        const store = useProjectStore.getState();
        const hist = [...(store.chatHistory[step] ?? [])];
        if (hist.length && hist[hist.length - 1].role === "assistant") {
          hist[hist.length - 1] = { role: "assistant", content: buffer };
          useProjectStore.setState({
            chatHistory: { ...store.chatHistory, [step]: hist },
          });
        }
      },
      () => setStreaming(false),
      () => {
        // html_updated: re-fetch step 4 data would happen via store update from backend
      },
      (err) => {
        console.error(err);
        setStreaming(false);
      }
    );
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const modeLabel = isStep4 ? "设计调整模式 — 描述修改需求，AI 将返回更新后的 HTML" : `协作模式 · 步骤 ${step}`;

  return (
    <div style={S.panel}>
      <div style={S.header}>💬 {modeLabel}</div>
      {isStep4 && (
        <div style={S.step4Banner}>
          AI 的回复若包含 HTML 代码，将自动更新右侧预览
        </div>
      )}
      <div style={S.history}>
        {history.map((m, i) => (
          m.role !== "system" && (
            <div key={i} style={m.role === "user" ? S.userMsg : S.assistantMsg}>
              {m.content || (streaming && i === history.length - 1 ? "▌" : "")}
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={S.inputRow}>
        <input
          style={S.input}
          placeholder={isStep4 ? "描述你想修改的地方…" : "有什么问题？"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={streaming}
        />
        <button style={S.sendBtn} onClick={send} disabled={streaming || !input.trim()}>
          {streaming ? "…" : "发送"}
        </button>
      </div>
    </div>
  );
}
