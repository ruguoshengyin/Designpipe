interface Props {
  onClick: () => void;
  loading?: boolean;
  done?: boolean;
  disabled?: boolean;
  label?: string;
}

export default function GenerateBtn({ onClick, loading, done, disabled, label }: Props) {
  const text = loading ? "生成中…" : done ? "重新生成" : (label ?? "生成");
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: disabled ? "#F0F0F0" : "#111",
        color: disabled ? "#BBB" : "#fff",
        border: "none", borderRadius: 8,
        padding: "10px 20px", fontSize: 13, fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "opacity .15s",
        opacity: loading ? 0.7 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "⏳ " : done ? "↺ " : "▶ "}{text}
    </button>
  );
}
