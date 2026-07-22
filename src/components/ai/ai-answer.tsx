import { Fragment, type ReactNode } from "react";
import { cleanInlineMarkdown, parseAiAnswer } from "@/features/ai/answer-format";

function inlineContent(value: string): ReactNode[] {
  const parts = value.split(/(\*\*[^*]+\*\*|__[^_]+__)/g).filter(Boolean);
  return parts.map((part, index) => {
    const bold = (part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"));
    const text = cleanInlineMarkdown(part);
    return bold ? <strong key={index} className="font-semibold text-slate-900">{text}</strong> : <Fragment key={index}>{text}</Fragment>;
  });
}

export function AiAnswer({ answer }: { answer: string }) {
  const blocks = parseAiAnswer(answer);
  return <div className="mt-4 space-y-3 overflow-hidden rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
    {blocks.map((block, index) => {
      if (block.type === "heading") return <h3 key={index} className="break-words font-semibold text-slate-900">{inlineContent(block.text)}</h3>;
      if (block.type === "paragraph") return <p key={index} className="whitespace-pre-wrap break-words">{inlineContent(block.text)}</p>;
      const List = block.type === "ordered-list" ? "ol" : "ul";
      return <List key={index} className={`space-y-2 pl-5 ${block.type === "ordered-list" ? "list-decimal" : "list-disc"}`}>
        {block.items.map((item, itemIndex) => <li key={itemIndex} className="break-words pl-1 marker:text-slate-400">{inlineContent(item)}</li>)}
      </List>;
    })}
  </div>;
}
