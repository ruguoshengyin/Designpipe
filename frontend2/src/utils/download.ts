// Download helpers and per-step content generators

export function triggerDownload(content: string, filename: string, mimeType = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

export function genStep1MD(): string {
  const d = (window as any).DPData?.step1 || {};
  const lines = [
    `# 竞品分析报告\n`,
    `## 分析目标\n${d.objective || ""}\n`,
    `## 分析焦点\n${(d.focus || []).map((f: string) => `- ${f}`).join("\n")}\n`,
    `## 竞品对比\n`,
  ];
  (d.competitors || []).forEach((c: any) => {
    lines.push(`### ${c.name}  \n> ${c.url || ""}\n`);
    lines.push(`**核心观察**：${c.observation || ""}\n`);
    lines.push(`**可借鉴**：${c.usable || ""}  **不照搬**：${c.avoid || ""}  **影响后续**：${c.impact || ""}\n`);
  });
  lines.push(`## 设计输入\n${(d.inputs || []).map((i: string) => `- ${i}`).join("\n")}\n`);
  return lines.join("\n");
}

export function genStep1CSV(): string {
  const d = (window as any).DPData?.step1 || {};
  const rows: string[][] = [["竞品", "官网", "核心观察", "可借鉴", "不照搬", "影响后续"]];
  (d.competitors || []).forEach((c: any) => {
    rows.push([c.name, c.url, c.observation, c.usable, c.avoid, c.impact].map((v: any) => `"${(v||"").replace(/"/g,'""')}"`));
  });
  return rows.map(r => r.join(",")).join("\n");
}

export function genStep2MD(): string {
  const d = (window as any).DPData?.step2 || {};
  const lines = [
    `# 设计分析报告\n`,
    `## 核心诊断\n${d.diagnosis || ""}\n`,
    `## 机会优先级\n`,
  ];
  (d.opportunities || []).forEach((o: any) => {
    lines.push(`- **[${o.p}] ${o.name}**：${o.why || ""}  →  ${o.impact || ""}`);
  });
  lines.push(`\n## 设计张力\n`);
  (d.tensions || []).forEach((t: any) => {
    lines.push(`- **${t.name}**：${t.expr || ""}  →  应对：${t.design || ""}`);
  });
  lines.push(`\n## 设计原则\n${(d.principles || []).map((p: string) => `- ${p}`).join("\n")}\n`);
  return lines.join("\n");
}

export function genStep6HTML(): string {
  return ((window as any).DPData?.step6 || {}).html || "<!-- 高保真 HTML 尚未生成 -->";
}

export function genDeliveryMD(): string {
  const d = (window as any).DPData?.step7 || {};
  const lines = [
    `# 交付文档\n`,
    `## 项目背景\n${d.background || ""}\n`,
    `## 核心诊断\n${d.diagnosis || ""}\n`,
    `## 选定方向\n${d.direction || ""}\n`,
    `## 关键决策\n${(d.decisions || []).map((x: string) => `- ${x}`).join("\n")}\n`,
    `## 下一步建议\n${(d.next || []).map((x: string) => `- ${x}`).join("\n")}\n`,
  ];
  return lines.join("\n");
}
