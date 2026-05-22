interface Props {
  content: string;
}

// Minimal markdown renderer (no external deps)
function renderMarkdown(md: string): string {
  return md
    // headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:#111;margin:20px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;color:#111;margin:24px 0 10px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px">$1</h1>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // table rows
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split("|").map((c: string) => c.trim());
      const isHeader = cells.every((c: string) => /^[-:]+$/.test(c));
      if (isHeader) return "";
      return '<tr>' + cells.map((c: string) => `<td style="padding:6px 12px;border-bottom:1px solid #F0F0F0;font-size:13px;color:#333">${c}</td>`).join("") + '</tr>';
    })
    // wrap table rows in table
    .replace(/(<tr>[\s\S]*?<\/tr>)+/g, (m) => `<table style="width:100%;border-collapse:collapse;margin:12px 0">${m}</table>`)
    // bullet points
    .replace(/^- (.+)$/gm, '<li style="font-size:13px;color:#444;padding:3px 0;list-style:none;padding-left:16px;position:relative">· $1</li>')
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (m) => `<ul style="margin:8px 0;padding:0">${m}</ul>`)
    // horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #EEEEEE;margin:20px 0">')
    // paragraphs
    .replace(/\n\n/g, '</p><p style="font-size:13px;color:#555;line-height:1.7;margin:8px 0">')
    // wrap in p
    .replace(/^(?!<)(.+)$/gm, (m) => m.trim() ? m : "");
}

export default function MarkdownView({ content }: Props) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 12, padding: 24,
        lineHeight: 1.7, color: "#333",
      }}
      dangerouslySetInnerHTML={{ __html: `<p style="font-size:13px;color:#555;line-height:1.7;margin:8px 0">${renderMarkdown(content)}</p>` }}
    />
  );
}
