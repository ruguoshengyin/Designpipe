// AI utility functions — stream from /api/proxy-chat

export function extractJSON(text: string): any {
  let t = text
    .replace(/```(?:json|JSON)?\s*\n?/g, '')
    .replace(/\n?```\s*$/g, '')
    .trim();
  const start = t.indexOf('{');
  if (start === -1) return null;
  const tries = [t.lastIndexOf('}'), t.lastIndexOf('},'), t.lastIndexOf('"}')];
  for (const end of tries) {
    if (end <= start) continue;
    let raw = t.slice(start, end + 1);
    raw = raw.replace(/,(\s*[}\]])/g, '$1');
    try { return JSON.parse(raw); } catch {}
  }
  for (let i = t.length - 1; i > start; i--) {
    if (t[i] !== '}') continue;
    let raw = t.slice(start, i + 1);
    raw = raw.replace(/,(\s*[}\]])/g, '$1');
    try { return JSON.parse(raw); } catch {}
  }
  return null;
}

export async function aiJSON(prompt: string, image?: string | null, timeoutMs = 120000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const body: any = { messages: [{ role: "user", content: prompt }] };
  if (image) body.image = image;
  let res: Response;
  try {
    res = await fetch("/api/proxy-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === "AbortError") throw new Error("AI 响应超时（超过 120 秒），请重试");
    throw new Error(`网络错误：${e.message}，请确认 Designpipe 后端正在运行`);
  }
  if (!res.ok) { clearTimeout(timer); throw new Error(`HTTP ${res.status}`); }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "", buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop()!;
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const chunk = line.slice(6);
        if (chunk === "[DONE]") break;
        try {
          const content = JSON.parse(chunk).content || "";
          if (content.startsWith("__ERROR__")) {
            const rest = content.slice(9);
            const sep = rest.indexOf("::");
            const code = sep !== -1 ? rest.slice(0, sep) : rest;
            const msg = sep !== -1 ? rest.slice(sep + 2) : rest;
            const err: any = new Error(msg); err.code = code; throw err;
          }
          full += content;
        } catch (e: any) { if (e.code !== undefined) throw e; }
      }
    }
  } catch (e: any) {
    if (e.name !== "AbortError") { clearTimeout(timer); throw e; }
  }
  clearTimeout(timer);
  const parsed = extractJSON(full);
  if (!parsed) throw new Error(`JSON解析失败，原始回复：${full.slice(0, 200)}`);
  return parsed;
}

export async function aiText(
  prompt: string,
  image?: string | null,
  signal?: AbortSignal | null,
  maxTokens?: number
): Promise<string> {
  const body: any = { messages: [{ role: "user", content: prompt }] };
  if (image) body.image = image;
  if (maxTokens) body.max_tokens = maxTokens;
  const res = await fetch("/api/proxy-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal || null,
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "", buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop()!;
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const chunk = line.slice(6);
        if (chunk === "[DONE]") break;
        try {
          const content = JSON.parse(chunk).content || "";
          if (content.startsWith("__ERROR__")) {
            const rest = content.slice(9);
            const sep = rest.indexOf("::");
            const code = sep !== -1 ? rest.slice(0, sep) : rest;
            const msg = sep !== -1 ? rest.slice(sep + 2) : rest;
            const err: any = new Error(msg); err.code = code; throw err;
          }
          full += content;
        } catch (e: any) { if (e.code !== undefined) throw e; }
      }
    }
  } catch (e: any) {
    if (e.name !== "AbortError") throw e;
  }
  return full;
}

export function looksLikeCode(t: string): boolean {
  return (
    /```|<!doctype|<html|<head|<body|<style|<div|<section|<button|<span|<input|<img|<svg|<nav|<ul|<li/i.test(t)
    || /\{[^{}]*:[^{}]*;/.test(t)
  );
}

export function buildQAContext(): string {
  const raw = ((window as any).DPData?.qa);
  const qa: any[] = Array.isArray(raw) ? raw : [];
  const lines = qa.filter((q: any) => q.answer && q.answer.trim()).map((q: any) => `· ${q.question}：${q.answer}`);
  return lines.length ? `\n\n【用户补充信息（来自项目问答）】\n${lines.join("\n")}` : "";
}
