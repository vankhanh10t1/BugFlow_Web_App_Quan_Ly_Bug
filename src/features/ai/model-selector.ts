import type { AiChatInput } from "@/lib/validators/ai";

const DEFAULT_MODEL_FALLBACK = "llama-3.1-8b-instant";
const REASONING_MODEL_FALLBACK = "openai/gpt-oss-120b";
const reasoningKeywords = [
  "phan tich", "danh gia", "tom tat du an", "de xuat huong xu ly",
  "root cause", "nguyen nhan goc", "bao mat", "security review",
  "threat model", "kien truc", "rui ro",
];

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export type ModelSelectionInput = Pick<AiChatInput, "task" | "prompt"> & { contextLength?: number };

export function selectChatbotModel(input: ModelSelectionInput, env: NodeJS.ProcessEnv = process.env) {
  const prompt = normalized(input.prompt);
  const complex = input.prompt.length >= 800
    || (input.contextLength ?? 0) >= 6_000
    || reasoningKeywords.some((keyword) => prompt.includes(keyword));
  const defaultModel = env.GROQ_DEFAULT_MODEL?.trim() || DEFAULT_MODEL_FALLBACK;
  const reasoningModel = env.GROQ_REASONING_MODEL?.trim() || REASONING_MODEL_FALLBACK;
  return { model: complex ? reasoningModel : defaultModel, reasoning: complex };
}
