import Link from "next/link";
import type { ReactNode } from "react";

/*
 * Minimal, safe Markdown renderer for Journal posts.
 * Supports: ## / ### headings, paragraphs, "- " lists, "> " quotes,
 * **bold**, *italic* and [links](/path). Output is React elements only —
 * no raw HTML is ever injected.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key} className="font-medium text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) ?? [];
      const safe = href && (href.startsWith("/") || /^https?:\/\//.test(href));
      nodes.push(
        safe ? (
          href.startsWith("/") ? (
            <Link key={key} href={href} className="text-gold-400 underline underline-offset-4 hover:text-gold-300">{label}</Link>
          ) : (
            <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-gold-400 underline underline-offset-4 hover:text-gold-300">{label}</a>
          )
        ) : (
          label
        ),
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderMarkdown(source: string): ReactNode[] {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks.map((block, b) => {
    const trimmed = block.trim();
    const key = `b${b}`;
    if (trimmed.startsWith("### ")) {
      return <h3 key={key} className="mt-10 font-serif text-2xl text-white">{inline(trimmed.slice(4), key)}</h3>;
    }
    if (trimmed.startsWith("## ")) {
      return <h2 key={key} className="mt-12 font-serif text-3xl text-white">{inline(trimmed.slice(3), key)}</h2>;
    }
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={key} className="my-8 border-l-2 border-gold-500 pl-6 font-serif text-2xl italic text-gold-200">
          {inline(trimmed.replace(/^>\s?/gm, ""), key)}
        </blockquote>
      );
    }
    const lines = trimmed.split("\n");
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      return (
        <ul key={key} className="my-6 space-y-2 pl-5">
          {lines.map((l, i) => (
            <li key={i} className="list-disc marker:text-gold-500">{inline(l.replace(/^[-*]\s+/, ""), `${key}-${i}`)}</li>
          ))}
        </ul>
      );
    }
    return <p key={key} className="my-5 leading-relaxed">{inline(lines.join(" "), key)}</p>;
  });
}
