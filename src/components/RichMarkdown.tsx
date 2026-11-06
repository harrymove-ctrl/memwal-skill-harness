import React, { useState } from "react";
import { Check, Copy, FileText, Terminal } from "lucide-react";
import { fillStyle } from "../lib/dither";
import { DitherButton } from "./dithercn/dither-button";

const AUTO_TECH_TOKEN_REGEX =
  /(\[(?:SKILL|FLOW):[^\]]+\]|\bMEMWAL_[A-Z0-9_]+\b|@[a-z0-9-]+\/[a-z0-9-]+|\bapps\/[a-z0-9_-]+|\b(?:SKILL|AGENTS|CLAUDE|GEMINI|README)\.md\b|\.mcp\.json\b|--reason\s+'not planned'|\bWALM-(?:\*|\d+)\b|\b0x[a-fA-F0-9]{4,}(?:\.\.\.[a-fA-F0-9]+)?\b|dsh-resource:\/\/[^\s),]+)/g;

function renderSemanticChip(token: string, key: string | number) {
  const isTag = token.startsWith("[SKILL:") || token.startsWith("[FLOW:");
  return (
    <code
      key={key}
      className={`inline max-w-full rounded-[5px] px-1.5 py-[1px] font-mono text-[11.5px] leading-snug break-words ${
        isTag
          ? "bg-neutral-900/10 font-bold text-neutral-900 dark:bg-neutral-100/15 dark:text-neutral-100"
          : "bg-neutral-900/[0.06] font-medium text-neutral-800 dark:bg-neutral-100/[0.09] dark:text-neutral-200"
      }`}
    >
      {token}
    </code>
  );
}

/**
 * Renders inline markdown tokens (`code`, **bold**, ~~strike~~, [links](url))
 * plus subtle, readable monospace pills for technical identifiers.
 */
export const RichInlineMarkdown: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className }) => {
  if (!text) return null;

  // First pass: explicit Markdown syntax (`code`, **bold**, ~~strike~~, [link](url))
  const tokenRegex =
    /(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!part) return null;

        // Inline code: `...`
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          const inner = part.slice(1, -1);
          return renderSemanticChip(inner, `code-${i}`);
        }

        // Bold: **...**
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong
              key={`bold-${i}`}
              className="font-bold text-neutral-950 dark:text-white"
            >
              <RichInlineMarkdown text={part.slice(2, -2)} />
            </strong>
          );
        }

        // Strikethrough: ~~...~~
        if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
          return (
            <del
              key={`del-${i}`}
              className="text-red-700/80 line-through decoration-red-500/70 dark:text-red-300/80"
            >
              <RichInlineMarkdown text={part.slice(2, -2)} />
            </del>
          );
        }

        // Link: [label](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={`link-${i}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--ink)] underline decoration-[var(--ink)] underline-offset-2 hover:opacity-80"
            >
              {linkMatch[1]}
            </a>
          );
        }

        // Second pass on plain text: auto-highlight technical tokens so rules without backticks read cleanly
        const subParts = part.split(AUTO_TECH_TOKEN_REGEX);
        return (
          <React.Fragment key={`plain-${i}`}>
            {subParts.map((sub, j) => {
              if (!sub) return null;
              if (AUTO_TECH_TOKEN_REGEX.test(sub)) {
                AUTO_TECH_TOKEN_REGEX.lastIndex = 0;
                return renderSemanticChip(sub, `auto-${i}-${j}`);
              }
              AUTO_TECH_TOKEN_REGEX.lastIndex = 0;
              return <React.Fragment key={`txt-${i}-${j}`}>{sub}</React.Fragment>;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};

interface FrontmatterData {
  entries: Array<[string, string]>;
  body: string;
}

function parseYamlFrontmatter(raw: string): FrontmatterData {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { entries: [], body: raw };
  }
  const endIdx = trimmed.indexOf("\n---", 3);
  if (endIdx === -1) {
    return { entries: [], body: raw };
  }
  const yamlBlock = trimmed.slice(3, endIdx).trim();
  const body = trimmed.slice(endIdx + 4).trimStart();
  const entries: Array<[string, string]> = [];

  for (const line of yamlBlock.split("\n")) {
    if (/^\s+/.test(line) && entries.length > 0) {
      const prev = entries[entries.length - 1];
      const cont = line.trim();
      if (cont) {
        prev[1] = prev[1] ? `${prev[1]} ${cont}` : cont;
      }
      continue;
    }
    const topMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (topMatch) {
      const key = topMatch[1].trim();
      let val = topMatch[2].trim().replace(/^["']|["']$/g, "");
      if (val === ">-" || val === ">" || val === "|" || val === "|-") {
        val = "";
      }
      entries.push([key, val]);
    }
  }

  return { entries: entries.filter(([, v]) => v.length > 0), body };
}

function FencedCodeBlock({
  lang,
  code,
}: {
  lang: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");

  const ditherHeaderBg = fillStyle("dotted", {
    cell: 2,
    color: "color-mix(in oklab, var(--ink) 12%, transparent)",
  });

  return (
    <div className="my-2.5 overflow-hidden rounded-[8px] border-[1.2px] border-[var(--ink)] bg-[var(--sheet)]">
      <div className="relative isolate flex items-center justify-between overflow-hidden border-b border-[var(--ink)] bg-[var(--fill)] px-3 py-1.5">
        <div
          aria-hidden="true"
          style={ditherHeaderBg}
          className="pointer-events-none absolute inset-0 -z-10"
        />
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink)]">
          <Terminal className="size-3" />
          <span>{lang || "code"}</span>
        </span>
        <DitherButton
          size="sm"
          color="ink"
          variant="outline"
          fill="dotted"
          className="h-6 px-2 font-mono text-[10px]"
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? (
            <>
              <Check className="size-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </DitherButton>
      </div>
      <div className="overflow-x-auto bg-[var(--bg)] p-3 font-mono text-[11.5px] leading-[1.65] text-[var(--ink)]">
        {lines.map((l, idx) => (
          <div key={idx} className="flex">
            <span className="mr-3 w-7 shrink-0 select-none border-r border-[var(--grid)] pr-2 text-right text-[10px] text-[var(--ink2)] tabular-nums">
              {idx + 1}
            </span>
            <span className="whitespace-pre">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full architectural Markdown renderer with dithered callout headers,
 * YAML frontmatter cards, tables, fenced code blocks, lists, and inline code pills.
 */
export const RichMarkdown: React.FC<{
  markdown: string;
  compact?: boolean;
  className?: string;
}> = ({ markdown, compact = false, className = "" }) => {
  const { entries: frontmatter, body } = parseYamlFrontmatter(markdown || "");
  const lines = body.split("\n");

  const blocks: React.ReactNode[] = [];
  let i = 0;

  const ditherRuleStyle = fillStyle("gradient", {
    cell: 2,
    color: "color-mix(in oklab, var(--ink) 16%, transparent)",
    edge: "left",
    from: 0.9,
    length: 16,
    to: 0,
  });

  const ditherQuoteStripe = fillStyle("hatched", {
    cell: 2,
    color: "color-mix(in oklab, var(--ink) 16%, transparent)",
  });

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Fenced code block: ```lang ... ```
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push(
        <FencedCodeBlock
          key={`code-${i}`}
          lang={lang}
          code={codeLines.join("\n")}
        />
      );
      continue;
    }

    // 2. Markdown table: | ... |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith("|") &&
        lines[i].trim().endsWith("|")
      ) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines
        .filter((r) => !/^\|[\s\-:|]+\|$/.test(r))
        .map((r) =>
          r
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim())
        );

      if (rows.length > 0) {
        const [header, ...bodyRows] = rows;
        blocks.push(
          <div
            key={`table-${i}`}
            className="my-2.5 overflow-x-auto rounded-[8px] border-[1.2px] border-[var(--ink)] bg-[var(--sheet)]"
          >
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--ink)] bg-[var(--fill)] font-mono text-[10.5px] font-bold uppercase text-[var(--ink)]">
                  {header.map((cell, cIdx) => (
                    <th
                      key={cIdx}
                      className="border-r border-[var(--grid)] px-3 py-2 last:border-r-0"
                    >
                      <RichInlineMarkdown text={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--grid)]">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[var(--fill)]/50">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="border-r border-[var(--grid)] px-3 py-2 text-[var(--ink)] last:border-r-0"
                      >
                        <RichInlineMarkdown text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // 3. Headings: #, ##, ###
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      i++;
      if (level === 1) {
        blocks.push(
          <div
            key={`h1-${i}`}
            className="relative isolate mt-3 mb-2 flex items-center gap-2 overflow-hidden rounded-[6px] border border-[var(--ink)] bg-[var(--fill)] px-3 py-2"
          >
            <div
              aria-hidden="true"
              style={ditherRuleStyle}
              className="pointer-events-none absolute inset-0 -z-10"
            />
            <span className="border border-[var(--ink)] bg-[var(--ink)] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[var(--sheet)]">
              H1
            </span>
            <h2 className="text-[15px] font-bold tracking-tight text-[var(--ink)]">
              <RichInlineMarkdown text={text} />
            </h2>
          </div>
        );
      } else if (level === 2) {
        blocks.push(
          <div
            key={`h2-${i}`}
            className="mt-3 mb-1.5 flex items-center gap-2 border-b border-[var(--ink)] pb-1"
          >
            <span className="border border-[var(--ink)] bg-[var(--fill)] px-1.5 py-0.2 font-mono text-[9.5px] font-bold text-[var(--ink)]">
              §
            </span>
            <h3 className="font-mono text-[12.5px] font-bold uppercase tracking-wider text-[var(--ink)]">
              <RichInlineMarkdown text={text} />
            </h3>
          </div>
        );
      } else {
        blocks.push(
          <h4
            key={`h3-${i}`}
            className="mt-2.5 mb-1 font-mono text-[11.5px] font-bold uppercase tracking-wide text-[var(--ink)]"
          >
            <RichInlineMarkdown text={text} />
          </h4>
        );
      }
      continue;
    }

    // 4. Blockquote: > ...
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="relative isolate my-2 overflow-hidden rounded-r-[6px] border-l-[3px] border-[var(--ink)] bg-[var(--fill)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--ink)]"
        >
          <div
            aria-hidden="true"
            style={ditherQuoteStripe}
            className="pointer-events-none absolute inset-0 -z-10"
          />
          <RichInlineMarkdown text={quoteLines.join(" ")} />
        </blockquote>
      );
      continue;
    }

    // 5. Unordered or Ordered List
    if (/^(\d+\.|[-*•])\s+/.test(trimmed)) {
      const items: Array<{ marker: string; content: string; ordered: boolean }> =
        [];
      while (i < lines.length && /^(\d+\.|[-*•])\s+/.test(lines[i].trim())) {
        const rawItem = lines[i].trim();
        const m = rawItem.match(/^(\d+\.|[-*•])\s+(.+)$/);
        if (m) {
          items.push({
            marker: m[1].replace(".", ""),
            content: m[2],
            ordered: /^\d+\./.test(m[1]),
          });
        }
        i++;
      }
      blocks.push(
        <div key={`list-${i}`} className="my-2 space-y-1.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-[6px] border border-[var(--grid)] bg-[var(--sheet)] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-[var(--ink)]"
            >
              <span className="mt-0.5 shrink-0 rounded-[3px] border border-[var(--ink)] bg-[var(--fill)] px-1.5 py-0.2 font-mono text-[10px] font-bold tabular-nums text-[var(--ink)]">
                {item.ordered ? item.marker.padStart(2, "0") : "▪"}
              </span>
              <div className="min-w-0 flex-1">
                <RichInlineMarkdown text={item.content} />
              </div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 6. Standard Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^(\d+\.|[-*•])\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p
        key={`p-${i}`}
        className={`${
          compact ? "text-[12.5px]" : "text-[13px]"
        } my-1.5 leading-relaxed text-[var(--ink)]`}
      >
        <RichInlineMarkdown text={paraLines.join(" ")} />
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {frontmatter.length > 0 && (
        <div className="relative isolate mb-3 overflow-hidden rounded-[8px] border-[1.2px] border-[var(--ink)] bg-[var(--fill)] p-3">
          <div
            aria-hidden="true"
            style={fillStyle("dotted", {
              cell: 2,
              color: "color-mix(in oklab, var(--ink) 12%, transparent)",
            })}
            className="pointer-events-none absolute inset-0 -z-10"
          />
          <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink2)]">
            <FileText className="size-3 text-[var(--ink)]" />
            <span>SKILL.MD FRONTMATTER METADATA</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {frontmatter.map(([k, v]) => {
              const isWide =
                k.toLowerCase() === "description" ||
                v.length > 42 ||
                frontmatter.length === 1;
              return (
                <div
                  key={k}
                  className={`rounded-[5px] border border-[var(--grid)] bg-[var(--sheet)] px-2.5 py-1.5 text-[12px] ${
                    isWide ? "sm:col-span-2" : ""
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold uppercase text-[var(--ink2)]">
                    {k}:{" "}
                  </span>
                  <span className="font-semibold text-[var(--ink)]">
                    <RichInlineMarkdown text={v} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {blocks}
    </div>
  );
};
