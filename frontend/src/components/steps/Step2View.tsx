import { useRef } from "react";
import { useProjectStore } from "../../stores/project";
import { streamGenerate } from "../../api/client";
import GenerateBtn from "../GenerateBtn";
import type { Step2Data } from "../../types";

const S: Record<string, React.CSSProperties> = {
  section: { background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12 },
  diagnosis: { fontSize: 15, fontWeight: 600, color: "#FF0F27", lineHeight: 1.6 },
  tag: {
    display: "inline-block", padding: "3px 10px", borderRadius: 20,
    fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6,
  },
  bullet: { fontSize: 13, color: "#444", lineHeight: 1.7, paddingLeft: 16, position: "relative" },
  tensionRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  tensionBox: {
    flex: 1, background: "#F8F8F8", borderRadius: 8, padding: "8px 12px",
    fontSize: 13, color: "#333", textAlign: "center",
  },
  tensionNote: { fontSize: 11, color: "#888", marginTop: 4 },
  vs: { fontSize: 12, color: "#AAA", fontWeight: 700, flexShrink: 0 },
  oppRow: {
    display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #F5F5F5",
    alignItems: "flex-start",
  },
  p0: { background: "#FF0F27", color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  p1: { background: "#FF8F00", color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  p2: { background: "#888", color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 },
};

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  P0: S.p0, P1: S.p1, P2: S.p2,
};

export default function Step2View() {
  const { activeProject, steps, setStep, streaming, setStreaming, streamBuffer, appendStream, clearStream } =
    useProjectStore();
  const abortRef = useRef<AbortController | null>(null);

  const saved = steps[2];
  const step1 = steps[1];
  const isStreaming = streaming;

  function generate() {
    if (!activeProject || isStreaming || !step1) return;
    clearStream();
    setStreaming(true);
    abortRef.current = streamGenerate(
      { project_id: activeProject.id, step: 2 },
      appendStream,
      (dataType) => {
        const content = useProjectStore.getState().streamBuffer;
        setStep(2, { step: 2, data_type: dataType as "json", content, updated_at: new Date().toISOString() });
        setStreaming(false);
      },
      (err) => { console.error(err); setStreaming(false); }
    );
  }

  let data: Step2Data | null = null;
  if (saved?.content) {
    try { data = JSON.parse(saved.content); } catch {}
  }

  const rawBuffer = isStreaming ? streamBuffer : "";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Step 2 · 设计分析</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>核心诊断、决策模型、机会点</div>
        </div>
        <GenerateBtn onClick={generate} loading={isStreaming} done={!!saved} disabled={!step1} />
      </div>

      {isStreaming && (
        <div style={{ ...S.section, fontFamily: "monospace", fontSize: 12, color: "#888", whiteSpace: "pre-wrap" }}>
          {rawBuffer || "▌ 分析中…"}
        </div>
      )}

      {data && !isStreaming && (
        <>
          <div style={S.section}>
            <div style={S.sectionTitle}>核心诊断</div>
            <div style={S.diagnosis}>{data.diagnosis}</div>
          </div>

          {data.decisionModel?.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>用户决策模型</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.decisionModel.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ ...S.tag, background: "#F5F5F5", color: "#333" }}>{d.label}</div>
                    {i < data!.decisionModel.length - 1 && <span style={{ color: "#CCC" }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.tensions?.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>设计张力</div>
              {data.tensions.map((t, i) => (
                <div key={i}>
                  <div style={S.tensionRow}>
                    <div style={S.tensionBox}>{t.left}</div>
                    <div style={S.vs}>VS</div>
                    <div style={S.tensionBox}>{t.right}</div>
                  </div>
                  <div style={S.tensionNote}>{t.note}</div>
                </div>
              ))}
            </div>
          )}

          {data.opportunities?.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>机会点</div>
              {data.opportunities.map((o, i) => (
                <div key={i} style={S.oppRow}>
                  <div style={PRIORITY_STYLE[o.priority] ?? S.p2}>{o.priority}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{o.item}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{o.why} · {o.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.principles?.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>设计原则</div>
              {data.principles.map((p, i) => (
                <div key={i} style={{ fontSize: 13, color: "#444", padding: "4px 0" }}>· {p}</div>
              ))}
            </div>
          )}
        </>
      )}

      {!data && !isStreaming && (
        <div style={{ textAlign: "center", color: "#BBB", padding: "60px 0", fontSize: 14 }}>
          {step1 ? "点击「生成」开始设计分析" : "请先完成 Step 1 竞品研究"}
        </div>
      )}
    </div>
  );
}
