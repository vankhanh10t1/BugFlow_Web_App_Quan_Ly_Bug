export type AiAnswerBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] };

const orderedItem = /^\s*\d+[.)]\s+(.+)$/;
const unorderedItem = /^\s*[-*•]\s+(.+)$/;
const heading = /^\s*#{1,3}\s+(.+)$/;

export function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

export function parseAiAnswer(value: string): AiAnswerBlock[] {
  const blocks: AiAnswerBlock[] = [];
  let paragraph: string[] = [];
  let list: Extract<AiAnswerBlock, { type: "ordered-list" | "unordered-list" }> | undefined;

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = undefined;
  };

  for (const rawLine of value.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(heading);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: headingMatch[1] });
      continue;
    }

    const orderedMatch = line.match(orderedItem);
    const unorderedMatch = line.match(unorderedItem);
    if (orderedMatch || unorderedMatch) {
      flushParagraph();
      const type = orderedMatch ? "ordered-list" : "unordered-list";
      if (list?.type !== type) flushList();
      list ??= { type, items: [] };
      list!.items.push((orderedMatch ?? unorderedMatch)![1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
