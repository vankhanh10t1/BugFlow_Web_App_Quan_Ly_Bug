import type { AiSuggestion } from "@/lib/validators/ai";
import { aiSuggestionSchema } from "@/lib/validators/ai";
import { normalizeAiAnswer } from "@/features/ai/response-normalizer";
export const CHANGE_START = "<BUGFLOW_CHANGES>";
export const CHANGE_END = "</BUGFLOW_CHANGES>";
export function parseSuggestion(raw: string): AiSuggestion | null { const start = raw.indexOf(CHANGE_START); const end = raw.indexOf(CHANGE_END, start + CHANGE_START.length); if (start < 0 || end < 0) return null; try { const parsed = aiSuggestionSchema.safeParse(JSON.parse(raw.slice(start + CHANGE_START.length, end))); return parsed.success ? parsed.data : null; } catch { return null; } }
export function visibleAnswer(raw: string) { return normalizeAiAnswer(raw.split(CHANGE_START)[0] ?? ""); }
