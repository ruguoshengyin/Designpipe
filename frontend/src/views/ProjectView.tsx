import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useProjectStore } from "../stores/project";
import StepNav from "../components/StepNav";
import Step1View from "../components/steps/Step1View";
import Step2View from "../components/steps/Step2View";
import Step3View from "../components/steps/Step3View";
import Step4View from "../components/steps/Step4View";
import Step5View from "../components/steps/Step5View";
import ChatPanel from "../components/ChatPanel";

const STEP_LABELS = ["竞品研究", "设计分析", "概念方向", "高保真", "交付文档"];

const S: Record<string, React.CSSProperties> = {
  layout: { display: "flex", height: "100vh", overflow: "hidden", background: "#F5F5F5" },
  sidebar: {
    width: 220, background: "#fff", borderRight: "1px solid #EEEEEE",
    display: "flex", flexDirection: "column", flexShrink: 0,
  },
  sidebarTop: { padding: "20px 16px 12px", borderBottom: "1px solid #F0F0F0" },
  backBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 13, color: "#888", padding: "0 0 8px", display: "flex", alignItems: "center", gap: 4,
  },
  projectName: { fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.4 },
  projectScenario: { fontSize: 12, color: "#AAA", marginTop: 4, lineHeight: 1.4 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  content: { flex: 1, overflow: "auto", padding: 24 },
  chatArea: { height: 280, borderTop: "1px solid #EEE", background: "#fff", flexShrink: 0 },
};

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProject, setActiveProject, setSteps, currentStep, setCurrentStep, designSpec, setDesignSpec } =
    useProjectStore();

  const loadedRef = useRef(false);

  useEffect(() => {
    if (!id || loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const [project, steps] = await Promise.all([
          api.getProject(id),
          api.listSteps(id),
        ]);
        setActiveProject(project);
        setSteps(steps);

        // determine which step to show based on what's done
        const stepNums = Object.keys(steps).map(Number).sort((a, b) => a - b);
        const maxDone = stepNums.length ? Math.max(...stepNums) : 0;
        setCurrentStep(Math.min(maxDone + 1, 5));
      } catch (e) {
        console.error(e);
        navigate("/");
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!designSpec) {
      api.getDesignSpec().then((r) => setDesignSpec(r.spec)).catch(() => {});
    }
  }, []);

  if (!activeProject) {
    return <div style={{ padding: 40, color: "#888" }}>加载中…</div>;
  }

  const stepComponents: Record<number, JSX.Element> = {
    1: <Step1View />,
    2: <Step2View />,
    3: <Step3View />,
    4: <Step4View />,
    5: <Step5View />,
  };

  return (
    <div style={S.layout}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarTop}>
          <button style={S.backBtn} onClick={() => navigate("/")}>← 返回</button>
          <div style={S.projectName}>{activeProject.product || "项目"}</div>
          <div style={S.projectScenario}>{activeProject.target_user}</div>
        </div>
        <StepNav
          steps={STEP_LABELS}
          current={currentStep}
          onChange={setCurrentStep}
        />
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.content}>
          {stepComponents[currentStep] ?? <div style={{ color: "#888" }}>步骤不存在</div>}
        </div>
        <div style={S.chatArea}>
          <ChatPanel step={currentStep} />
        </div>
      </div>
    </div>
  );
}
