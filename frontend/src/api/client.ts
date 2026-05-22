import type { Project, StepData } from "../types";

const BASE = "/api";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

// Projects
export const api = {
  listProjects: () => req<Project[]>("/projects"),
  createProject: (data: { product: string; target_user: string; scenario: string }) =>
    req<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  getProject: (id: string) => req<Project>(`/projects/${id}`),
  updateProject: (id: string, data: Partial<Project>) =>
    req<{ ok: boolean }>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    fetch(BASE + `/projects/${id}`, { method: "DELETE" }),

  // Steps
  listSteps: (projectId: string) =>
    req<Record<number, StepData>>(`/projects/${projectId}/steps`),
  getStep: (projectId: string, step: number) =>
    req<StepData>(`/projects/${projectId}/steps/${step}`),
  saveStep: (projectId: string, step: number, data: { data_type: string; content: string }) =>
    req<{ ok: boolean }>(`/projects/${projectId}/steps/${step}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Design spec
  getDesignSpec: () => req<{ spec: string }>("/design-spec"),
};

// SSE streaming helper
export function streamGenerate(
  body: { project_id: string; step: number; direction?: string; image?: string },
  onDelta: (text: string) => void,
  onDone: (dataType: string) => void,
  onError: (err: string) => void
): AbortController {
  const ctrl = new AbortController();
  (async () => {
    try {
      const res = await fetch(BASE + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      await readSSE(res, onDelta, (ev) => {
        if (ev.done) onDone((ev.data_type as string) ?? "");
      });
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") onError(String(e));
    }
  })();
  return ctrl;
}

export function streamChat(
  body: { project_id: string; step: number; messages: object[]; image?: string },
  onDelta: (text: string) => void,
  onDone: () => void,
  onHtmlUpdated: () => void,
  onError: (err: string) => void
): AbortController {
  const ctrl = new AbortController();
  (async () => {
    try {
      const res = await fetch(BASE + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      await readSSE(res, onDelta, (ev) => {
        if (ev.html_updated) onHtmlUpdated();
        if (ev.done) onDone();
      });
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") onError(String(e));
    }
  })();
  return ctrl;
}

async function readSSE(
  res: Response,
  onDelta: (text: string) => void,
  onEvent: (ev: Record<string, unknown>) => void
) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const ev = JSON.parse(line.slice(6)) as Record<string, unknown>;
        if (ev.delta !== undefined) onDelta(ev.delta as string);
        else onEvent(ev);
      } catch {}
    }
  }
}
