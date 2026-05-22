import { useRef } from "react";
import { useProjectStore } from "../../stores/project";
import { streamGenerate } from "../../api/client";
import MarkdownView from "../MarkdownView";
import GenerateBtn from "../GenerateBtn";

export default function Step1View() {
  const { activeProject, steps, setStep, streaming, setStreaming, streamBuffer, appendStream, clearStream } =
    useProjectStore();
  const abortRef = useRef<AbortController | null>(null);

  const saved = steps[1];
  const isStreaming = streaming;

  function generate() {
    if (!activeProject || isStreaming) return;
    clearStream();
    setStreaming(true);

    abortRef.current = streamGenerate(
      { project_id: activeProject.id, step: 1 },
      appendStream,
      (dataType) => {
        const content = useProjectStore.getState().streamBuffer;
        setStep(1, { step: 1, data_type: dataType as "markdown", content, updated_at: new Date().toISOString() });
        setStreaming(false);
      },
      (err) => { console.error(err); setStreaming(false); }
    );
  }

  const content = isStreaming ? useProjectStore.getState().streamBuffer : saved?.content ?? "";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Step 1 · 竞品研究</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>AI 分析竞品，输出设计洞察</div>
        </div>
        <GenerateBtn onClick={generate} loading={isStreaming} done={!!saved} />
      </div>

      {content ? (
        <MarkdownView content={content} />
      ) : (
        <EmptyState text="点击「生成」开始竞品研究" />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", color: "#BBB", padding: "60px 0", fontSize: 14 }}>{text}</div>
  );
}
