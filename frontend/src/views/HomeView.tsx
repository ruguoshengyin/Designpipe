import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useProjectStore } from "../stores/project";
import type { Project } from "../types";

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#F5F5F5", padding: "32px 24px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  title: { fontSize: 22, fontWeight: 700, color: "#111" },
  newBtn: {
    background: "#FF0F27", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  card: {
    background: "#fff", borderRadius: 12, padding: 20, cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,.08)", transition: "box-shadow .15s",
  },
  cardProduct: { fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 6 },
  cardScenario: { fontSize: 13, color: "#888", marginBottom: 12, lineHeight: 1.5 },
  cardMeta: { fontSize: 12, color: "#BBB" },
  empty: { textAlign: "center", color: "#BBB", marginTop: 80, fontSize: 15 },

  // modal
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  modal: {
    background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,.15)",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111" },
  label: { fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6, display: "block" },
  input: {
    width: "100%", border: "1px solid #E0E0E0", borderRadius: 8,
    padding: "10px 12px", fontSize: 14, outline: "none", marginBottom: 16,
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%", border: "1px solid #E0E0E0", borderRadius: 8,
    padding: "10px 12px", fontSize: 14, outline: "none", resize: "vertical",
    minHeight: 80, marginBottom: 16, fontFamily: "inherit",
  },
  row: { display: "flex", gap: 12, justifyContent: "flex-end" },
  cancelBtn: {
    background: "none", border: "1px solid #DDD", borderRadius: 8,
    padding: "10px 20px", fontSize: 14, cursor: "pointer", color: "#666",
  },
  submitBtn: {
    background: "#FF0F27", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
};

export default function HomeView() {
  const navigate = useNavigate();
  const { projects, setProjects, setActiveProject, resetProjectState } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product: "", target_user: "", scenario: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listProjects().then(setProjects).catch(console.error);
  }, []);

  function openProject(p: Project) {
    setActiveProject(p);
    resetProjectState();
    navigate(`/project/${p.id}`);
  }

  async function handleCreate() {
    if (!form.product.trim()) return;
    setLoading(true);
    try {
      const p = await api.createProject(form);
      const updated = await api.listProjects();
      setProjects(updated);
      setShowModal(false);
      setForm({ product: "", target_user: "", scenario: "" });
      openProject(p);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.title}>Designpipe 2.0</div>
        <button style={S.newBtn} onClick={() => setShowModal(true)}>+ 新建项目</button>
      </div>

      {projects.length === 0 ? (
        <div style={S.empty}>暂无项目，点击「新建项目」开始</div>
      ) : (
        <div style={S.grid}>
          {projects.map((p) => (
            <div key={p.id} style={S.card} onClick={() => openProject(p)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.08)")}
            >
              <div style={S.cardProduct}>{p.product || "未命名产品"}</div>
              <div style={S.cardScenario}>{p.scenario || "—"}</div>
              <div style={S.cardMeta}>{p.target_user} · {p.created_at?.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={S.modal}>
            <div style={S.modalTitle}>新建项目</div>
            <label style={S.label}>产品名称</label>
            <input style={S.input} placeholder="例：转转 App 商品详情页"
              value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
            <label style={S.label}>目标用户</label>
            <input style={S.input} placeholder="例：18-35岁二手买家"
              value={form.target_user} onChange={(e) => setForm({ ...form, target_user: e.target.value })} />
            <label style={S.label}>核心场景</label>
            <textarea style={S.textarea} placeholder="例：用户在商品详情页判断是否信任卖家并下单"
              value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
            <div style={S.row}>
              <button style={S.cancelBtn} onClick={() => setShowModal(false)}>取消</button>
              <button style={S.submitBtn} onClick={handleCreate} disabled={loading}>
                {loading ? "创建中…" : "开始设计"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
