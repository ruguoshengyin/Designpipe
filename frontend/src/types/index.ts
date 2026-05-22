export interface Project {
  id: string;
  product: string;
  target_user: string;
  scenario: string;
  direction?: string;
  created_at: string;
}

export interface StepData {
  step: number;
  data_type: "json" | "html" | "markdown";
  content: string;
  updated_at: string;
}

export interface Direction {
  key: "A" | "B" | "C";
  title: string;
  subtitle: string;
  oneliner: string;
  moves: string[];
  advantage: string;
  tradeoff: string;
  cost: "low" | "med" | "high";
  impact: string;
  cite: string;
  recommended?: boolean;
}

export interface Step3Data {
  recommendation: { pick: string; reason: string };
  directions: Direction[];
}

export interface Step2Data {
  diagnosis: string;
  decisionModel: Array<{ label: string; sub?: string }>;
  tensions: Array<{ left: string; right: string; note: string }>;
  judgements: string[];
  opportunities: Array<{ priority: string; item: string; why: string; impact: string }>;
  principles: string[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
