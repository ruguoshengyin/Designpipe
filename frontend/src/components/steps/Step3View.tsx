import { useRef, useState } from "react";
import { useProjectStore } from "../../stores/project";
import { streamGenerate, api } from "../../api/client";
import GenerateBtn from "../GenerateBtn";
import type { Step3Data, Direction } from "../../types";

const COST_COLOR: Record<string, string> = { low: "#4CAF50", med: "#FF8F00", high: "#FF0F27" };

const S: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16,
    border: "2px solid transparent", cursor: "pointer", transition: "border-color .15s",
  },
  cardSelected: { borderColor: "#FF0F27" },
  cardRecommended: { borderColor: "#FFE0E0" },
  key: {
    display: "inline-block", width: 28, height: 28, borderRadius: "50%",
    background: "#F5F5F5", color: "#111", fontSize: 14, fontWeight: 700,
    textAlign: "center", lineHeight: "28px", marginRight: 10, flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 700, color: "#111" },
  oneliner: { fontSize: 13, color: "#666", marginTop: 6, lineHeight: 1.5 },
  moves: { marginTop: 12 },
  move: { fontSize: 12, color: "#444", padding: "3px 0" },
  tag: { display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, marginRight: 6 },
  confirmRow: { marginTop: 20, display: "flex", alignItems: "center", gap: 12 },
  confirmBtn: {
    background: "#FF0F27", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  wireframeSection: { marginTop: 24 },
  iframeWrap: { background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #EEE" },
};

export default function Step3View() {
  const { activeProject, steps, setStep, streaming, setStreaming, streamBuffer, appendStream, clearStream, chosenDirection, setChosenDirection } =
    useProjectStore();

  const [selected, setSelected] = useState<string>(chosenDirection || "");
  const [wireframes, setWireframes] = useState<Record<string, string>>({});
  const [generatingWf, setGeneratingWf] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const saved = steps[3];
  const step2 = steps[2];

  function generate() {
    if (!activeProject || streaming || !step2) return;
    clearStream();
    setStreaming(true);
    streamGenerate(
      { project_id: activeProject.id, step: 3 },
      appendStream,
      (dataType) => {
        const content = useProjectStore.getState().streamBuffer;
        setStep(3, { step: 3, data_type: dataType as "json", content, updated_at: new Date().toISOString() });
        setStreaming(false);
      },
      (err) => { console.error(err); setStreaming(false); }
    );
  }

  function generateWireframe(key: string) {
    if (!activeProject || generatingWf || !saved) return;
    setGeneratingWf(key);
    let buf = "";
    streamGenerate(
      { project_id: activeProject.id, step: 31, direction: key as "A" | "B" | "C" },
      (delta) => { buf += delta; setWireframes((w) => ({ ...w, [key]: buf })); },
      () => { setGeneratingWf(""); setWireframes((w) => ({ ...w, [key]: buf })); },
      (err) => { console.error(err); setGeneratingWf(""); }
    );
  }

  async function confirmDirection() {
    if (!selected || !activeProject) return;
    await api.updateProject(activeProject.id, { direction: selected });
    setChosenDirection(selected);
  }

  let data: Step3Data | null = null;
  if (saved?.content) {
    try { data = JSON.parse(saved.content); } catch {}
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Step 3 · 概念方向</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>三个差异化方向，选择后进入高保真</div>
        </div>
        <GenerateBtn onClick={generate} loading={streaming} done={!!saved} disabled={!step2} />
      </div>

      {streaming && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, fontFamily: "monospace", fontSize: 12, color: "#888" }}>
          ▌ 生成中…
        </div>
      )}

      {data && !streaming && (
        <>
          {data.recommendation && (
            <div style={{ background: "#FFF5F5", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#C62828" }}>
              AI 推荐 <strong>{data.recommendation.pick}</strong>：{data.recommendation.reason}
            </div>
          )}

          {data.directions?.map((d: Direction) => {
            const isSelected = selected === d.key;
            const isRec = data!.recommendation?.pick === d.key;
            return (
              <div
                key={d.key}
                style={{ ...S.card, ...(isSelected ? S.cardSelected : isRec ? S.cardRecommended : {}) }}
                onClick={() => setSelected(d.key)}
              >
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ ...S.key, background: isSelected ? "#FF0F27" : "#F5F5F5", color: isSelected ? "#fff" : "#111" }}>
                    {d.key}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.title}>{d.title} <span style={{ fontSize: 12, color: "#AAA", fontWeight: 400 }}>{d.subtitle}</span></div>
                    <div style={S.oneliner}>{d.oneliner}</div>
                  </div>
                  {isRec && (
                    <div style={{ ...S.tag, background: "#FF0F27", color: "#fff" }}>推荐</div>
                  )}
                </div>

                <div style={S.moves}>
                  {d.moves?.map((m, i) => (
                    <div key={i} style={S.move}>· {m}</div>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ ...S.tag, background: "#F5F5F5", color: COST_COLOR[d.cost] }}>
                    复杂度：{d.cost}
                  </span>
                  <span style={{ fontSize: 12, color: "#888" }}>{d.advantage}</span>
                </div>

                {/* Wireframe section */}
                <div style={S.wireframeSection}>
                  {wireframes[d.key] ? (
                    <div style={S.iframeWrap}>
                      <iframe
                        srcDoc={wireframes[d.key]}
                        style={{ width: "390px", height: "600px", border: "none", display: "block" }}
                        title={`wireframe-${d.key}`}
                      />
                    </div>
                  ) : (
                    <button
                      style={{
                        border: "1px dashed #DDD", background: "none", borderRadius: 8,
                        padding: "8px 16px", fontSize: 12, color: "#888", cursor: "pointer",
                      }}
                      onClick={(e) => { e.stopPropagation(); generateWireframe(d.key); }}
                      disabled={generatingWf === d.key}
                    >
                      {generatingWf === d.key ? "生成线框图…" : "+ 生成线框图预览"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div style={S.confirmRow}>
            <div style={{ fontSize: 13, color: "#666" }}>
              {selected ? `已选择方向 ${selected}` : "请点击一个方向选择"}
            </div>
            <button
              style={{ ...S.confirmBtn, opacity: selected ? 1 : 0.4 }}
              onClick={confirmDirection}
              disabled={!selected}
            >
              确认方向 → 进入高保真
            </button>
            {chosenDirection && (
              <div style={{ fontSize: 13, color: "#4CAF50" }}>✓ 已确认方向 {chosenDirection}</div>
            )}
          </div>
        </>
      )}

      {!data && !streaming && (
        <div style={{ textAlign: "center", color: "#BBB", padding: "60px 0", fontSize: 14 }}>
          {step2 ? "点击「生成」获取三个设计方向" : "请先完成 Step 2 设计分析"}
        </div>
      )}
    </div>
  );
}
