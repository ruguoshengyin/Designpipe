import type { CSSProperties, ReactNode } from "react";

// ── Icon (stroke SVG set) ──────────────────────────────────────────────────
interface IconProps { name: string; size?: number; stroke?: number; style?: CSSProperties; className?: string; }
export function Icon({ name, size = 16, stroke = 1.5, style, className }: IconProps) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style, className };
  switch (name) {
    case "logo": return <svg {...common}><path d="M4 6h10a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H4z"/><path d="M4 6v10"/><circle cx="14" cy="11" r="1.6" fill="currentColor" stroke="none"/></svg>;
    case "chevron-left": return <svg {...common}><path d="m15 18-6-6 6-6"/></svg>;
    case "chevron-right": return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case "chevron-down": return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case "check": return <svg {...common}><path d="m5 12 5 5L20 7"/></svg>;
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "arrow-right": return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "sparkles": return <svg {...common}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>;
    case "send": return <svg {...common}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>;
    case "regenerate": return <svg {...common}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case "download": return <svg {...common}><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/></svg>;
    case "external": return <svg {...common}><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/></svg>;
    case "doc": return <svg {...common}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg>;
    case "target": return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case "wand": return <svg {...common}><path d="m4 20 12-12"/><path d="M14 6 18 2l4 4-4 4z"/></svg>;
    case "x": return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case "spinner": return <svg {...common} style={{ ...style, animation: "spin 0.8s linear infinite" }}><circle cx="12" cy="12" r="9" strokeOpacity="0.25"/><path d="M12 3a9 9 0 0 1 9 9" strokeOpacity="1"/></svg>;
    default: return null;
  }
}

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeTone = "default" | "ok" | "warn" | "danger" | "ac";
const BADGE_STYLES: Record<BadgeTone, CSSProperties> = {
  default: { background: "var(--bg-2)", color: "var(--tx-3)", border: "1px solid var(--bd-1)" },
  ok:      { background: "var(--ok-soft)", color: "var(--ok)", border: "1px solid #86efac" },
  warn:    { background: "var(--warn-soft)", color: "var(--warn)", border: "1px solid #fcd34d" },
  danger:  { background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid #fca5a5" },
  ac:      { background: "var(--ac-soft)", color: "var(--ac)", border: "1px solid var(--ac-line)" },
};
export function Badge({ tone = "default", children, style }: { tone?: BadgeTone; children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...BADGE_STYLES[tone], ...style }}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style, padded = true }: { children: ReactNode; style?: CSSProperties; padded?: boolean }) {
  return (
    <div style={{ background: "var(--bg-0)", border: "1px solid var(--bd-1)", borderRadius: var_radius_l, padding: padded ? 20 : 0, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}
const var_radius_l = "var(--radius-l)";

// ── SectionTitle ──────────────────────────────────────────────────────────
export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {eyebrow && <div className="mono" style={{ fontSize: 10, color: "var(--tx-4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{eyebrow}</div>}
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-1)", letterSpacing: "-0.01em" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "var(--tx-3)", marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────
interface BtnProps {
  children?: ReactNode;
  variant?: "primary" | "ghost" | "soft";
  size?: "sm" | "md";
  icon?: string;
  iconRight?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  style?: CSSProperties;
}
export function Btn({ children, variant = "ghost", size = "md", icon, iconRight, onClick, disabled, title, style }: BtnProps) {
  const h = size === "sm" ? 30 : 36;
  const px = size === "sm" ? 10 : 14;
  const fs = size === "sm" ? 12 : 13;
  const baseStyle: CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    height: h, padding: `0 ${px}px`,
    border: "none", borderRadius: 8,
    fontSize: fs, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", transition: "all .15s", opacity: disabled ? 0.45 : 1,
    whiteSpace: "nowrap",
    ...(variant === "primary" ? { background: "var(--tx-1)", color: "#fff" } :
        variant === "soft"    ? { background: "var(--ac-soft)", color: "var(--ac)", border: "1px solid var(--ac-line)" } :
                                { background: "transparent", color: "var(--tx-2)" }),
    ...style,
  };
  return (
    <button title={title} style={baseStyle} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled && variant !== "primary") e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={e => { if (!disabled && variant !== "primary") e.currentTarget.style.background = variant === "soft" ? "var(--ac-soft)" : "transparent"; }}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
}

// ── RightRail ──────────────────────────────────────────────────────────────
export function RightRail({ children }: { children: ReactNode }) {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 12,
      position: "sticky", top: 0, alignSelf: "flex-start",
    }}>
      {children}
    </div>
  );
}

export function RailSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} style={{ background: "var(--bg-0)", border: "1px solid var(--bd-1)", borderRadius: 10, overflow: "hidden" }}>
      <summary style={{ padding: "10px 14px", fontSize: 11.5, fontWeight: 600, color: "var(--tx-2)", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {title}
        <Icon name="chevron-down" size={12} style={{ color: "var(--tx-4)" }} />
      </summary>
      <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--bd-1)" }}>
        {children}
      </div>
    </details>
  );
}

export function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 8 }}>
      <div style={{ fontSize: 10, color: "var(--tx-4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--tx-2)", lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

// ── PrevStepHint ───────────────────────────────────────────────────────────
export function PrevStepHint({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg-1)", border: "1px solid var(--bd-1)", borderRadius: 8, fontSize: 12, color: "var(--tx-3)" }}>
      <Icon name="arrow-right" size={12} style={{ color: "var(--ac)", flexShrink: 0 }} />
      {label}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
export function Empty({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--tx-4)", fontSize: 13 }}>
      {text}
    </div>
  );
}

// ── Generating overlay ─────────────────────────────────────────────────────
export function Generating({ label }: { label: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(250,250,250,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10, borderRadius: "var(--radius-l)", backdropFilter: "blur(4px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: "var(--bg-0)", border: "1px solid var(--bd-1)", borderRadius: 10 }}>
        <Icon name="spinner" size={16} style={{ color: "var(--ac)" }} />
        <span style={{ fontSize: 13, color: "var(--tx-2)" }}>{label}</span>
      </div>
    </div>
  );
}
