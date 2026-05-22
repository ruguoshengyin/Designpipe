import { useProjectStore } from "../stores/project";

interface Props {
  steps: string[];
  current: number;
  onChange: (s: number) => void;
}

const S: Record<string, React.CSSProperties> = {
  nav: { flex: 1, padding: "12px 0", overflowY: "auto" },
  item: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 16px", cursor: "pointer", transition: "background .1s",
  },
  dot: {
    width: 24, height: 24, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  label: { fontSize: 13, fontWeight: 500 },
};

export default function StepNav({ steps, current, onChange }: Props) {
  const { steps: stepData } = useProjectStore();

  return (
    <nav style={S.nav}>
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = !!stepData[num];
        const isActive = num === current;

        const dotStyle: React.CSSProperties = {
          ...S.dot,
          background: isActive ? "#FF0F27" : isDone ? "#E8F5E9" : "#F5F5F5",
          color: isActive ? "#fff" : isDone ? "#4CAF50" : "#BBB",
        };
        const labelStyle: React.CSSProperties = {
          ...S.label,
          color: isActive ? "#111" : isDone ? "#444" : "#AAA",
          fontWeight: isActive ? 700 : 500,
        };
        const itemBg = isActive ? "#FFF5F5" : "transparent";

        return (
          <div
            key={num}
            style={{ ...S.item, background: itemBg }}
            onClick={() => onChange(num)}
            onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "#F9F9F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? "#FFF5F5" : "transparent")}
          >
            <div style={dotStyle}>{isDone && !isActive ? "✓" : num}</div>
            <div style={labelStyle}>{label}</div>
          </div>
        );
      })}
    </nav>
  );
}
