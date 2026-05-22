import { useRef } from "react";
import { useProjectStore } from "../../stores/project";
import { streamGenerate } from "../../api/client";
import GenerateBtn from "../GenerateBtn";
import MarkdownView from "../MarkdownView";

export default function Step5View() {
  const { activeProject, steps, setStep, streaming, setStreaming, streamBuffer, appendStream, clearStream } =
    useProjectStore();

  const saved = steps[5];
  const step4 = steps[4];

  function generate() {
    if (!activeProject || streaming || !step4) return;
    clearStream();
    setStreaming(true);
    streamGenerate(
      { project_id: activeProject.id, step: 5 },
      appendStream,
      (dataType) => {
        const content = useProjectStore.getState().streamBuffer;
        setStep(5, { step: 5, data_type: dataType as "markdown", content, updated_at: new Date().toISOString() });
        setStreaming(false);
      },
      (err) => { console.error(err); setStreaming(false); }
    );
  }

  async function exportMarkdown() {
    if (!saved?.content) return;
    const blob = new Blob([saved.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `handoff-${activeProject?.product ?? "design"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const content = streaming ? streamBuffer : saved?.content ?? "";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Step 5 · 交付文档</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>项目背景、设计决策、下一步建议</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {saved?.content && (
            <button onClick={exportMarkdown} style={{
              border: "1px solid #DDD", background: "#fff", borderRadius: 8,
              padding: "8px 16px", fontSize: 13, cursor: "pointer", color: "#444",
            }}>
              导出 Markdown
            </button>
          )}
          <GenerateBtn onClick={generate} loading={streaming} done={!!saved} disabled={!step4} />
        </div>
      </div>

      {content ? (
        <MarkdownView content={content} />
      ) : (
        <div style={{ textAlign: "center", color: "#BBB", padding: "60px 0", fontSize: 14 }}>
          {step4 ? "点击「生成」生成交付文档" : "请先完成 Step 4 高保真设计"}
        </div>
      )}
    </div>
  );
}
