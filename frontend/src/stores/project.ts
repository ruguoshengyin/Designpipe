import { create } from "zustand";
import type { Project, StepData, ChatMessage } from "../types";

interface ProjectStore {
  // list
  projects: Project[];
  setProjects: (p: Project[]) => void;

  // active project
  activeProject: Project | null;
  setActiveProject: (p: Project | null) => void;

  // steps data (keyed by step number)
  steps: Record<number, StepData>;
  setStep: (step: number, data: StepData) => void;
  setSteps: (steps: Record<number, StepData>) => void;

  // current step UI
  currentStep: number;
  setCurrentStep: (s: number) => void;

  // chosen direction (A/B/C)
  chosenDirection: string;
  setChosenDirection: (d: string) => void;

  // streaming state
  streaming: boolean;
  setStreaming: (v: boolean) => void;
  streamBuffer: string;
  appendStream: (chunk: string) => void;
  clearStream: () => void;

  // chat history per step
  chatHistory: Record<number, ChatMessage[]>;
  appendChat: (step: number, msg: ChatMessage) => void;
  clearChat: (step: number) => void;

  // design spec (loaded once)
  designSpec: string;
  setDesignSpec: (s: string) => void;

  // reset for new project
  resetProjectState: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),

  activeProject: null,
  setActiveProject: (activeProject) => set({ activeProject }),

  steps: {},
  setStep: (step, data) => set((s) => ({ steps: { ...s.steps, [step]: data } })),
  setSteps: (steps) => set({ steps }),

  currentStep: 1,
  setCurrentStep: (currentStep) => set({ currentStep }),

  chosenDirection: "",
  setChosenDirection: (chosenDirection) => set({ chosenDirection }),

  streaming: false,
  setStreaming: (streaming) => set({ streaming }),
  streamBuffer: "",
  appendStream: (chunk) => set((s) => ({ streamBuffer: s.streamBuffer + chunk })),
  clearStream: () => set({ streamBuffer: "" }),

  chatHistory: {},
  appendChat: (step, msg) =>
    set((s) => ({
      chatHistory: {
        ...s.chatHistory,
        [step]: [...(s.chatHistory[step] ?? []), msg],
      },
    })),
  clearChat: (step) =>
    set((s) => ({ chatHistory: { ...s.chatHistory, [step]: [] } })),

  designSpec: "",
  setDesignSpec: (designSpec) => set({ designSpec }),

  resetProjectState: () =>
    set({
      steps: {},
      currentStep: 1,
      chosenDirection: "",
      streaming: false,
      streamBuffer: "",
      chatHistory: {},
    }),
}));
