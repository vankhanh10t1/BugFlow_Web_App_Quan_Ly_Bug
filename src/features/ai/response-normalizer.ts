const localizedLabels: Array<[RegExp, string]> = [
  [/^(\s*(?:#{1,3}\s*)?(?:\d+[.)]|[-*•])?\s*)Beschreiben\b\s*:?[ \t]*/gimu, "$1Mô tả: "],
  [/^(\s*(?:#{1,3}\s*)?(?:\d+[.)]|[-*•])?\s*)Beschreibung\b\s*:?[ \t]*/gimu, "$1Mô tả: "],
  [/^(\s*(?:#{1,3}\s*)?(?:\d+[.)]|[-*•])?\s*)Schritte zur Reproduktion\b\s*:?[ \t]*/gimu, "$1Các bước tái hiện: "],
  [/^(\s*(?:#{1,3}\s*)?(?:\d+[.)]|[-*•])?\s*)Erwartetes Ergebnis\b\s*:?[ \t]*/gimu, "$1Kết quả mong đợi: "],
  [/^(\s*(?:#{1,3}\s*)?(?:\d+[.)]|[-*•])?\s*)Tatsächliches Ergebnis\b\s*:?[ \t]*/gimu, "$1Kết quả thực tế: "],
];

export function normalizeAiAnswer(value: string) {
  return localizedLabels.reduce((answer, [pattern, replacement]) => answer.replace(pattern, replacement), value)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
