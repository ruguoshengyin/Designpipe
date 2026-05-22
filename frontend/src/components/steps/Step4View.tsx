import { useRef, useEffect, useState } from "react";
import { useProjectStore } from "../../stores/project";
import { streamGenerate, api } from "../../api/client";
import GenerateBtn from "../GenerateBtn";

const S: Record<string, React.CSSProperties> = {
  layout: { display: "flex", gap: 20 },
  left: { flex: 1, minWidth: 0 },
  right: { width: 420, flexShrink: 0 },
  preview: {
    background: "#fff", borderRadius: 12, border: "1px solid #EEE",
    overflow: "hidden", position: "sticky", top: 0,
  },
  previewHeader: {
    padding: "10px 16px", borderBottom: "1px solid #F0F0F0",
    fontSize: 12, color: "#888", fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  deviceFrame: {
    width: 390, height: 720, border: "none", display: "block",
    margin: "0 auto",
  },
  section: { background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16 },
};

export default function Step4View() {
  const { activeProject, steps, setStep, streaming, setStreaming, streamBuffer, appendStream, clearStream, chosenDirection } =
    useProjectStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");

  const saved = steps[4];
  const step3 = steps[3];

  // sync saved HTML to iframe
  useEffect(() => {
    const html = saved?.content ?? "";
    setHtmlContent(html);
  }, [saved]);

  // also subscribe to real-time updates (after chat HTML update)
  useEffect(() => {
    const unsub = useProjectStore.subscribe((state) => {
      const html = state.steps[4]?.content ?? "";
      setHtmlContent(html);
    });
    return unsub;
  }, []);

  function generate() {
    if (!activeProject || streaming || !step3 || !chosenDirection) return;
    clearStream();
    setStreaming(true);

    let buf = "";
    streamGenerate(
      { project_id: activeProject.id, step: 4, direction: chosenDirection as "A" | "B" | "C" },
      (delta) => { buf += delta; appendStream(delta); },
      (dataType) => {
        const content = useProjectStore.getState().streamBuffer;
        setStep(4, { step: 4, data_type: dataType as "html", content, updated_at: new Date().toISOString() });
        setStreaming(false);
      },
      (err) => { console.error(err); setStreaming(false); }
    );
  }

  async function exportHtml() {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hifi-${activeProject?.product ?? "design"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const displayHtml = streaming ? streamBuffer : htmlContent;
  const canGenerate = !!step3 && !!chosenDirection;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Step 4 · 高保真设计</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            {chosenDirection ? `方向 ${chosenDirection} · 转转设计系统` : "请先在 Step 3 确认方向"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {htmlContent && (
            <button onClick={exportHtml} style={{
              border: "1px solid #DDD", background: "#fff", borderRadius: 8,
              padding: "8px 16px", fontSize: 13, cursor: "pointer", color: "#444",
            }}>
              导出 HTML
            </button>
          )}
          <GenerateBtn onClick={generate} loading={streaming} done={!!saved} disabled={!canGenerate} />
        </div>
      </div>

      <div style={S.layout}>
        <div style={S.left}>
          {!canGenerate && (
            <div style={{ ...S.section, color: "#AAA", textAlign: "center", padding: "40px 0" }}>
              请先完成 Step 3 并确认设计方向
            </div>
          )}
          {canGenerate && !displayHtml && !streaming && (
            <div style={{ ...S.section, color: "#BBB", textAlign: "center", padding: "60px 0" }}>
              点击「生成」创建高保真原型
            </div>
          )}
          {streaming && !displayHtml && (
            <div style={{ ...S.section, color: "#888", fontFamily: "monospace", fontSize: 12 }}>
              ▌ 生成中…
            </div>
          )}
          {displayHtml && (
            <div style={S.section}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>HTML 源码预览（只读）</div>
              <textarea
                readOnly
                value={displayHtml}
                style={{
                  width: "100%", height: 300, fontFamily: "monospace", fontSize: 11,
                  border: "1px solid #EEE", borderRadius: 8, padding: 12, resize: "vertical",
                  color: "#444", background: "#FAFAFA", outline: "none",
                }}
              />
            </div>
          )}
        </div>

        <div style={S.right}>
          <div style={S.preview}>
            <div style={S.previewHeader}>
              <span>手机预览 (390px)</span>
              {streaming && <span style={{ color: "#FF8F00" }}>● 生成中</span>}
            </div>
            <div style={{ overflowY: "auto", maxHeight: 720 }}>
              <iframe
                ref={iframeRef}
                srcDoc={displayHtml || "<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;color:#CCC;font-family:sans-serif'>等待生成…</body></html>"}
                style={S.deviceFrame}
                title="hifi-preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
