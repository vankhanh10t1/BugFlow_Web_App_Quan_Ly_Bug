import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]*`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g);
  return parts.map((part, i) => { if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 text-sm">{part.slice(1,-1)}</code>; if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2,-2)}</strong>; const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/); return link ? <a key={i} href={link[2]} target="_blank" rel="noreferrer noopener" className="text-blue-600 underline">{link[1]}</a> : part; });
}
export function MarkdownViewer({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n"); const nodes: ReactNode[] = []; let code: string[] | null = null;
  lines.forEach((line, i) => { if (line.startsWith("```")) { if (code) { nodes.push(<pre key={`c${i}`} className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100"><code>{code.join("\n")}</code></pre>); code = null; } else code = []; return; } if (code) { code.push(line); return; } const h = line.match(/^(#{1,3})\s+(.+)/); if (h) { const C = `h${h[1].length}` as "h1"|"h2"|"h3"; nodes.push(<C key={i} className="mt-6 mb-2 font-semibold tracking-tight">{inline(h[2])}</C>); } else if (/^[-*]\s+/.test(line)) nodes.push(<div key={i} className="ml-5 list-item list-disc">{inline(line.slice(2))}</div>); else if (/^>\s?/.test(line)) nodes.push(<blockquote key={i} className="my-3 border-l-4 border-slate-300 pl-4 text-slate-600">{inline(line.replace(/^>\s?/, ""))}</blockquote>); else if (line.trim()) nodes.push(<p key={i} className="my-2 whitespace-pre-wrap leading-7">{inline(line)}</p>); else nodes.push(<div key={i} className="h-2" />); });
  return <div className="markdown-viewer break-words">{nodes}</div>;
}
