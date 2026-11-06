"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Info,
  Lightbulb,
  Link2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  WrapText,
} from "lucide-react";
import { TextReveal } from "@/components/interior/text-reveal";

export interface Source {
  id?: string;
  url: string;
  title?: string;
}

export interface MarkdownBlockProps {
  /** HextaUI Pro Markdown text prop (can also be passed via children or content) */
  text?: string;
  /** Children markdown string (for static content like <Markdown>{md}</Markdown>) */
  children?: string;
  /** Legacy/compat prop alias for text */
  content?: string;
  /** Paces the text, shows the caret, and completes unfinished syntax */
  streaming?: boolean;
  /** Turn pacing off to render text exactly as received */
  smooth?: boolean;
  /** Turns [1] into a citation chip for sources[0], and so on */
  sources?: Source[];
  /** Text size: "sm" for chat, "base" for articles/SKILL.md */
  size?: "sm" | "base";
  /** Show a shareable link icon on headings */
  anchors?: boolean;
  /** Optional custom element overrides */
  components?: Record<string, React.ComponentType<any>>;
  /** Optional centered article container mode (like HextaUI /blocks/markdown preview) */
  centeredArticle?: boolean;
  /** Optional top-right Demo / Streaming control pill */
  showDemoControls?: boolean;
  /** Use interior.dev TextReveal on headings and lead summary */
  enableTextReveal?: boolean;
  /** Document title or filename shown in the reader bar */
  title?: string;
  /** Optional subtitle / bucket badge */
  badge?: string;
  /** Whether to show the top document toolbar */
  showToolbar?: boolean;
  /** Optional callback when user clicks Copy */
  onCopy?: () => void;
  /** Optional callback when user clicks Download .md */
  onDownload?: () => void;
  /** Optional max height class for scrollable container */
  maxHeightClass?: string;
  className?: string;
}

export type AlertKind = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

interface ParsedBlock {
  type:
    | "frontmatter"
    | "h1"
    | "h2"
    | "h3"
    | "alert"
    | "blockquote"
    | "code"
    | "table"
    | "tasklist"
    | "ul"
    | "ol"
    | "image"
    | "hr"
    | "p";
  text?: string;
  lang?: string;
  codeTitle?: string;
  alertKind?: AlertKind;
  alertTitle?: string;
  items?: string[];
  orderedIndices?: number[];
  tasks?: { checked: boolean; text: string }[];
  headers?: string[];
  rows?: string[][];
  frontmatter?: Record<string, string>;
  alt?: string;
  src?: string;
}

/**
 * Completes unfinished Markdown tokens while streaming so raw asterisks,
 * unclosed backticks, or half-typed code fences never flash.
 */
export function completeStreamingMarkdown(raw: string): string {
  if (!raw) return "";
  let out = raw;

  // Close unclosed fenced code block
  const fenceCount = (out.match(/^```/gm) || []).length;
  if (fenceCount % 2 === 1) {
    out += "\n```";
  }

  // Close unclosed inline bold or inline code on the last line
  const lines = out.split("\n");
  const lastIdx = lines.length - 1;
  if (lastIdx >= 0 && !lines[lastIdx].trim().startsWith("```")) {
    const last = lines[lastIdx];
    const boldCount = (last.match(/\*\*/g) || []).length;
    if (boldCount % 2 === 1) {
      lines[lastIdx] += "**";
    }
    const backtickCount = (last.replace(/```/g, "").match(/`/g) || []).length;
    if (backtickCount % 2 === 1) {
      lines[lastIdx] += "`";
    }
  }
  return lines.join("\n");
}

function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[`*_~[\]()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function parseMarkdownBlocks(md: string): ParsedBlock[] {
  const normalized = md.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const blocks: ParsedBlock[] = [];
  let i = 0;

  // Optional YAML frontmatter at top of SKILL.md (supports multi-line >- blocks)
  if (lines[0]?.trim() === "---") {
    let endIdx = -1;
    for (let j = 1; j < Math.min(lines.length, 40); j++) {
      if (lines[j].trim() === "---") {
        endIdx = j;
        break;
      }
    }
    if (endIdx > 0) {
      const fm: Record<string, string> = {};
      let lastKey = "";
      for (let j = 1; j < endIdx; j++) {
        const line = lines[j];
        if (/^\s+/.test(line) && lastKey) {
          const cont = line.trim();
          if (cont) {
            fm[lastKey] = fm[lastKey] ? `${fm[lastKey]} ${cont}` : cont;
          }
          continue;
        }
        const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (m) {
          const k = m[1].trim();
          let v = m[2].trim().replace(/^["']|["']$/g, "");
          if (v === ">-" || v === ">" || v === "|" || v === "|-") {
            v = "";
          }
          fm[k] = v;
          lastKey = k;
        }
      }
      if (Object.keys(fm).length > 0) {
        blocks.push({ type: "frontmatter", frontmatter: fm });
      }
      i = endIdx + 1;
    }
  }

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block: ```ts title="hooks/use-results.ts" or ```ts hooks/use-results.ts
    if (trimmed.startsWith("```")) {
      const meta = trimmed.slice(3).trim();
      const parts = meta.split(/\s+/);
      const lang = parts[0] || "ts";
      let codeTitle = "";
      const titleMatch = meta.match(/title=["']([^"']+)["']/);
      if (titleMatch) {
        codeTitle = titleMatch[1];
      } else if (parts.length > 1) {
        codeTitle = parts.slice(1).join(" ");
      }
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({
        type: "code",
        lang,
        codeTitle,
        text: codeLines.join("\n"),
      });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Standalone Markdown image ![alt](src)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({
        type: "image",
        alt: imgMatch[1] || "Image",
        src: imgMatch[2],
      });
      i++;
      continue;
    }

    // Markdown Table
    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])
    ) {
      const parseRow = (line: string) =>
        line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());

      const headers = parseRow(trimmed);
      i += 2; // skip header + separator line
      const rows: string[][] = [];
      while (
        i < lines.length &&
        lines[i].trim().includes("|") &&
        lines[i].trim() !== ""
      ) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    // GitHub Callout / Alert (> [!TIP], > [!NOTE], > [!IMPORTANT], > [!WARNING], > [!CAUTION]) or Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const firstLine = quoteLines[0] || "";
      const alertMatch = firstLine.match(
        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i
      );
      if (alertMatch) {
        const kind = alertMatch[1].toUpperCase() as AlertKind;
        const customTitle = alertMatch[2]?.trim();
        const bodyLines = quoteLines.slice(1).filter(Boolean);
        blocks.push({
          type: "alert",
          alertKind: kind,
          alertTitle:
            customTitle ||
            kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase(),
          text: bodyLines.join(" ") || customTitle || "",
        });
      } else {
        blocks.push({
          type: "blockquote",
          text: quoteLines.join(" "),
        });
      }
      continue;
    }

    // Task list (- [x] or - [ ])
    if (/^[-*+]\s+\[([ xX])\]\s+/.test(trimmed)) {
      const tasks: { checked: boolean; text: string }[] = [];
      while (
        i < lines.length &&
        /^[-*+]\s+\[([ xX])\]\s+/.test(lines[i].trim())
      ) {
        const m = lines[i].trim().match(/^[-*+]\s+\[([ xX])\]\s+(.+)$/);
        if (m) {
          tasks.push({
            checked: m[1].toLowerCase() === "x",
            text: m[2].trim(),
          });
        }
        i++;
      }
      blocks.push({ type: "tasklist", tasks });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (
        i < lines.length &&
        /^[-*+]\s+/.test(lines[i].trim()) &&
        !/^[-*+]\s+\[([ xX])\]\s+/.test(lines[i].trim())
      ) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      const orderedIndices: number[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const m = lines[i].trim().match(/^(\d+)\.\s+(.*)$/);
        orderedIndices.push(m ? parseInt(m[1], 10) : items.length + 1);
        items.push(m ? m[2] : lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items, orderedIndices });
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !(
        lines[i].trim().includes("|") &&
        i + 1 < lines.length &&
        /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])
      )
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
  }

  return blocks;
}

function renderInlineMarkdown(
  text: string,
  sources: Source[] = []
): React.ReactNode[] {
  const sanitized = text.replace(/\s+[—–]\s+/g, ": ").replace(/[—–]/g, ", ");
  // Split by inline code, bold, markdown links, or [N] citation markers
  const pattern =
    /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[\d+\])/g;
  const tokens = sanitized.split(pattern);

  return tokens.map((tok, idx) => {
    if (!tok) return null;

    // Inline code (`useEffect`, `isPending`, etc.) — leaves [1] inside code untouched!
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
      return (
        <code
          key={idx}
          className="mx-1 my-0.5 inline-block max-w-full rounded-md border border-stone-200/85 bg-stone-100/95 px-2 py-0.5 align-baseline font-mono text-[0.84em] leading-[1.45] font-medium break-all text-stone-800 dark:border-white/14 dark:bg-white/[0.08] dark:text-stone-100"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }

    // Bold
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
      return (
        <strong
          key={idx}
          className="font-semibold text-stone-950 dark:text-white"
        >
          {tok.slice(2, -2)}
        </strong>
      );
    }

    // Citation chip [1], [2], etc. -> HextaUI Pro inline source chip
    const citeMatch = tok.match(/^\[(\d+)\]$/);
    if (citeMatch && sources.length > 0) {
      const citeIndex = parseInt(citeMatch[1], 10) - 1;
      const src = sources[citeIndex];
      if (src) {
        const label = src.title || src.url;
        const badgeChar = label.trim().charAt(0).toUpperCase() || "S";
        return (
          <a
            key={idx}
            href={src.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Citation ${citeMatch[1]}: ${label} (opens in a new tab)`}
            className="mx-1 inline-flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-stone-100/90 py-0.5 ps-1 pe-2.5 align-baseline text-[12px] font-medium text-stone-700 no-underline transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-stone-950 dark:border-white/12 dark:bg-white/[0.08] dark:text-stone-200 dark:hover:text-white"
          >
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-stone-200/90 font-mono text-[10px] font-bold text-stone-700 dark:bg-white/15 dark:text-stone-200">
              {badgeChar}
            </span>
            <span className="truncate max-w-[140px]">{label}</span>
          </a>
        );
      }
    }

    // Standard Markdown Link [text](url)
    const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const isExternal = /^https?:\/\//i.test(linkMatch[2]);
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          aria-label={
            isExternal
              ? `${linkMatch[1]} (opens in a new tab)`
              : linkMatch[1]
          }
          className="inline-flex items-center gap-1 font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-4 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          <span>{linkMatch[1]}</span>
          {isExternal && <ExternalLink className="size-3 opacity-75" />}
        </a>
      );
    }

    return <React.Fragment key={idx}>{tok}</React.Fragment>;
  });
}

// ============================================================================
// PART 1: MarkdownHeading (HextaUI Pro Heading with id + optional share anchor)
// ============================================================================
export const MarkdownHeading: React.FC<{
  level: 1 | 2 | 3;
  text: string;
  anchors?: boolean;
  enableTextReveal?: boolean;
  sources?: Source[];
}> = ({ level, text, anchors = false, enableTextReveal = false, sources = [] }) => {
  const id = slugifyHeading(text);
  const [copiedAnchor, setCopiedAnchor] = useState(false);

  const handleCopyAnchor = () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedAnchor(true);
    setTimeout(() => setCopiedAnchor(false), 1500);
  };

  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  const sizeClass =
    level === 1
      ? "pb-1 text-[20px]/[1.42] sm:text-[22px]/[1.42] font-bold tracking-[-0.02em] text-neutral-950 dark:text-neutral-50"
      : level === 2
        ? "mt-4 border-t border-neutral-200/70 pt-4 text-[16px]/[1.45] font-semibold tracking-[-0.01em] text-neutral-900 dark:border-white/[0.08] dark:text-neutral-100"
        : "pt-2 text-[14.5px]/[1.5] font-semibold text-neutral-900 dark:text-neutral-100";

  return (
    <Tag id={id} className={`group relative flex items-center gap-2 ${sizeClass}`}>
      <span>
        {renderInlineMarkdown(
          text.replace(/\s+[—–]\s+/g, ": ").replace(/[—–]/g, ", "),
          sources
        )}
      </span>
      {anchors && (
        <button
          type="button"
          onClick={handleCopyAnchor}
          aria-label={`Link to ${text}`}
          title={`Copy link to #${id}`}
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-neutral-200"
        >
          {copiedAnchor ? (
            <Check className="size-3.5 text-neutral-700 dark:text-neutral-200" />
          ) : (
            <Link2 className="size-3.5" />
          )}
        </button>
      )}
    </Tag>
  );
};

// ============================================================================
// PART 2: MarkdownAlert (HextaUI Pro Callout for [!TIP], [!NOTE], etc.)
// ============================================================================
export const MarkdownAlert: React.FC<{
  kind?: AlertKind;
  title?: string;
  text: string;
  sources?: Source[];
}> = ({ kind = "TIP", title, text, sources = [] }) => {
  const palette = {
    TIP: {
      bg: "bg-emerald-500/[0.08] border-emerald-500/20 dark:bg-emerald-500/[0.11] dark:border-emerald-400/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      Icon: Lightbulb,
      defaultTitle: "Tip",
    },
    NOTE: {
      bg: "bg-sky-500/[0.08] border-sky-500/20 dark:bg-sky-500/[0.11] dark:border-sky-400/20",
      iconColor: "text-sky-600 dark:text-sky-400",
      Icon: Info,
      defaultTitle: "Note",
    },
    IMPORTANT: {
      bg: "bg-purple-500/[0.08] border-purple-500/20 dark:bg-purple-500/[0.11] dark:border-purple-400/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      Icon: Sparkles,
      defaultTitle: "Important",
    },
    WARNING: {
      bg: "bg-amber-500/[0.09] border-amber-500/25 dark:bg-amber-500/[0.12] dark:border-amber-400/25",
      iconColor: "text-amber-600 dark:text-amber-400",
      Icon: AlertTriangle,
      defaultTitle: "Warning",
    },
    CAUTION: {
      bg: "bg-rose-500/[0.08] border-rose-500/25 dark:bg-rose-500/[0.12] dark:border-rose-400/25",
      iconColor: "text-rose-600 dark:text-rose-400",
      Icon: Flame,
      defaultTitle: "Caution",
    },
  }[kind];

  const Icon = palette.Icon;
  const heading = title || palette.defaultTitle;

  return (
    <div
      role="note"
      aria-label={heading}
      className={`rounded-2xl border p-4 sm:p-5 ${palette.bg}`}
    >
      <div className="flex items-start gap-3.5">
        <span className={`mt-0.5 shrink-0 ${palette.iconColor}`}>
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-[14px] font-semibold text-stone-950 dark:text-stone-100">
            {heading}
          </div>
          <div className="text-[14px]/[1.65] text-stone-600 dark:text-stone-300">
            {renderInlineMarkdown(text, sources)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PART 3: MarkdownTable (HextaUI Pro Scrollable Table + Copy as Markdown / CSV)
// ============================================================================
export const MarkdownTable: React.FC<{
  headers: string[];
  rows: string[][];
  sources?: Source[];
}> = ({ headers, rows, sources = [] }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<"md" | "csv" | null>(null);

  const copyTable = (format: "md" | "csv") => {
    let output = "";
    if (format === "md") {
      const headLine = `| ${headers.join(" | ")} |`;
      const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
      const bodyLines = rows.map((r) => `| ${r.join(" | ")} |`);
      output = [headLine, sepLine, ...bodyLines].join("\n");
    } else {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      output = [
        headers.map(esc).join(","),
        ...rows.map((r) => r.map(esc).join(",")),
      ].join("\n");
    }
    navigator.clipboard.writeText(output);
    setCopiedFormat(format);
    setMenuOpen(false);
    setTimeout(() => setCopiedFormat(null), 1600);
  };

  return (
    <div className="group/table relative overflow-hidden rounded-2xl border border-stone-200/85 bg-white shadow-2xs dark:border-white/[0.11] dark:bg-white/[0.02]">
      {/* Copy Table Menu Button (Top-Right) */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Copy table options"
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-stone-200/90 bg-white/95 px-2 text-[11.5px] font-medium text-stone-600 shadow-2xs backdrop-blur-xs transition hover:bg-stone-50 hover:text-stone-900 dark:border-white/15 dark:bg-stone-900/95 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            {copiedFormat ? (
              <>
                <Check className="size-3 text-emerald-500" />
                <span>Copied {copiedFormat.toUpperCase()}</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
                <ChevronDown className="size-3 opacity-70" />
              </>
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white p-1 text-[12.5px] shadow-xl dark:border-white/15 dark:bg-stone-900"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => copyTable("md")}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/10"
              >
                <span>Copy as Markdown</span>
                <span className="font-mono text-[10px] text-stone-400">.md</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => copyTable("csv")}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/10"
              >
                <span>Copy as CSV</span>
                <span className="font-mono text-[10px] text-stone-400">.csv</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/85 dark:border-white/[0.09] dark:bg-white/[0.035]">
              {headers.map((h, hIdx) => (
                <th
                  key={hIdx}
                  scope="col"
                  className={`px-4 py-3 font-semibold whitespace-nowrap text-stone-900 dark:text-stone-100 ${
                    hIdx === headers.length - 1 ? "pr-20" : ""
                  }`}
                >
                  {renderInlineMarkdown(h, sources)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/65 dark:divide-white/[0.07]">
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="transition-colors hover:bg-stone-50/50 dark:hover:bg-white/[0.02]"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-3.5 ${
                      cIdx === 0
                        ? "font-medium whitespace-nowrap text-stone-900 dark:text-stone-100"
                        : cIdx === row.length - 1
                          ? "whitespace-nowrap text-stone-600 dark:text-stone-300"
                          : "text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    {renderInlineMarkdown(cell, sources)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// PART 4: MarkdownImage (HextaUI Pro Image with lazy loading, error & caption)
// ============================================================================
export const MarkdownImage: React.FC<{
  src: string;
  alt?: string;
}> = ({ src, alt = "" }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <figure className="my-4 overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50/60 dark:border-white/10 dark:bg-white/[0.03]">
      {!errored ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`max-h-[420px] w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <div className="flex h-32 items-center justify-center font-mono text-xs text-stone-400">
          Image unavailable ({alt || src})
        </div>
      )}
      {alt && (
        <figcaption className="border-t border-stone-200/60 px-4 py-2 text-center text-xs text-stone-500 dark:border-white/10 dark:text-stone-400">
          {alt}
        </figcaption>
      )}
    </figure>
  );
};

// ============================================================================
// PART 5: MarkdownCodeBlock (HextaUI Pro Code Block with header, wrap, download, copy)
// ============================================================================
export const MarkdownCodeBlock: React.FC<{
  lang?: string;
  title?: string;
  code: string;
}> = ({ lang = "ts", title, code }) => {
  const [wrap, setWrap] = useState(true);
  const [copied, setCopied] = useState(false);

  const badgeLabel = (lang || "code").toUpperCase().slice(0, 4);
  const headerTitle =
    title ||
    (lang === "bash" || lang === "sh"
      ? "terminal"
      : lang === "json"
        ? "config.json"
        : `snippet.${lang || "ts"}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = headerTitle.replace(/[^a-zA-Z0-9._-]/g, "_");
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-stone-50/70 shadow-2xs dark:border-white/[0.11] dark:bg-[#141619]">
      <div className="flex items-center justify-between border-b border-stone-200/80 bg-stone-100/75 px-3.5 py-2 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-[5px] bg-stone-700 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-stone-200 dark:text-stone-900">
            {badgeLabel}
          </span>
          <span className="font-mono text-[12.5px] font-medium text-stone-600 dark:text-stone-300">
            {headerTitle}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWrap((w) => !w)}
            aria-label="Toggle word wrap"
            title="Toggle line wrap"
            className={`inline-flex size-7 cursor-pointer items-center justify-center rounded-lg transition ${
              wrap
                ? "bg-stone-200/80 text-stone-900 dark:bg-white/12 dark:text-white"
                : "text-stone-500 hover:bg-stone-200/50 dark:text-stone-400 dark:hover:bg-white/10"
            }`}
          >
            <WrapText className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download code snippet"
            title="Download file"
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Download className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code"
            title="Copy code"
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      <pre
        className={`overflow-x-auto p-4 font-mono text-[12.5px]/[1.7] text-stone-800 dark:text-stone-200 ${
          wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ============================================================================
// MAIN HEXTAUI PRO MARKDOWN BLOCK
// ============================================================================
export function Markdown({
  text,
  children,
  content,
  streaming = false,
  smooth = true,
  sources = [],
  size = "base",
  anchors = true,
  centeredArticle = false,
  showDemoControls = false,
  enableTextReveal = true,
  title = "SKILL.md",
  badge,
  showToolbar = false,
  onCopy,
  onDownload,
  maxHeightClass = "",
  className = "",
}: MarkdownBlockProps) {
  const rawSource = text ?? children ?? content ?? "";

  const [viewMode, setViewMode] = useState<"reader" | "raw">("reader");
  const [demoOpen, setDemoOpen] = useState(false);
  const [isReplayingStream, setIsReplayingStream] = useState(false);
  const [streamedLength, setStreamedLength] = useState<number>(rawSource.length);
  const [copiedAll, setCopiedAll] = useState(false);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActivelyStreaming = streaming || isReplayingStream;

  const stopStreamTimer = useCallback(() => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  }, []);

  const triggerReplayStream = useCallback(() => {
    stopStreamTimer();
    setViewMode("reader");
    setIsReplayingStream(true);
    setStreamedLength(Math.min(48, rawSource.length));

    const stepChars = Math.max(18, Math.ceil(rawSource.length / 26));
    streamTimerRef.current = setInterval(() => {
      setStreamedLength((prev) => {
        if (prev + stepChars >= rawSource.length) {
          stopStreamTimer();
          setIsReplayingStream(false);
          return rawSource.length;
        }
        return prev + stepChars;
      });
    }, 45);
  }, [rawSource.length, stopStreamTimer]);

  useEffect(() => {
    stopStreamTimer();
    setIsReplayingStream(false);
    setStreamedLength(rawSource.length);
    return () => stopStreamTimer();
  }, [rawSource, stopStreamTimer]);

  const effectiveMarkdown = useMemo(() => {
    if (!isActivelyStreaming || !smooth) {
      return rawSource;
    }
    const sliced = rawSource.slice(0, streamedLength);
    return completeStreamingMarkdown(sliced);
  }, [rawSource, isActivelyStreaming, smooth, streamedLength]);

  const blocks = useMemo(
    () => parseMarkdownBlocks(effectiveMarkdown),
    [effectiveMarkdown]
  );

  const sectionHeadings = useMemo(
    () =>
      blocks
        .filter((b) => b.type === "h2" && b.text)
        .map((b) => b.text as string),
    [blocks]
  );

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(rawSource);
    } catch {
      // ignore
    }
    setCopiedAll(true);
    onCopy?.();
    setTimeout(() => setCopiedAll(false), 1800);
  };

  const textSizeClass =
    size === "base"
      ? "text-[15px]/[1.78] sm:text-[15.5px]/[1.8]"
      : "text-[13.5px]/[1.68]";

  return (
    <div
      data-slot="markdown"
      data-size={size}
      aria-busy={isActivelyStreaming}
      data-streaming={isActivelyStreaming ? "" : undefined}
      className={`relative overflow-hidden rounded-[22px] border border-stone-200/85 bg-white text-stone-800 shadow-xs dark:border-white/[0.11] dark:bg-[#111316] dark:text-stone-200 ${className}`}
    >
      {/* Solid Card Markdown Toolbar + Quick Section Jump Bar */}
      {showToolbar && (
        <div className="relative flex flex-col gap-2 rounded-t-[18px] border-b border-neutral-200/80 bg-neutral-50 px-4 py-2.5 dark:border-white/[0.09] dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-neutral-700 dark:border-white/12 dark:bg-white/10 dark:text-neutral-200">
                SKILL.MD
              </span>
              <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </span>
              {badge && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-sans text-[11px] font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                  {badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  Download .md
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleCopyAll()}
                className="cursor-pointer rounded-lg bg-neutral-900 px-3 py-1 text-[11.5px] font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                {copiedAll ? "Copied ✓" : "Copy .md"}
              </button>
            </div>
          </div>

          {sectionHeadings.length > 0 && viewMode === "reader" && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-200/60 pt-1.5 dark:border-white/[0.07]">
              <span className="shrink-0 text-[10.5px] font-medium text-neutral-400">
                Sections:
              </span>
              {sectionHeadings.slice(0, 6).map((sec) => {
                const secId = slugifyHeading(sec);
                return (
                  <a
                    key={secId}
                    href={`#${secId}`}
                    className="max-w-full truncate rounded-full border border-neutral-200/80 bg-neutral-50/80 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 no-underline transition hover:border-neutral-400 hover:text-neutral-900 dark:border-white/10 dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:text-white"
                  >
                    {sec.replace(/[`*_]/g, "")}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Top-Right HextaUI Pro "Demo ▾" Floating Pill (Matches User Screenshot 2 & 3) */}
      {showDemoControls && (
        <div
          data-slot="demo-panel"
          className="absolute top-3.5 right-3.5 z-20 flex flex-col items-end gap-2"
        >
          <button
            type="button"
            onClick={() => setDemoOpen((v) => !v)}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-stone-200/90 bg-white/95 ps-3 pe-3 text-[13px] font-medium text-stone-800 shadow-sm backdrop-blur-md transition hover:bg-stone-50 dark:border-white/15 dark:bg-stone-900/95 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            <SlidersHorizontal className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Demo</span>
            <ChevronDown className="size-3.5 opacity-70" />
          </button>

          {demoOpen && (
            <section
              aria-label="Demo controls"
              className="w-64 overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-3 text-stone-800 shadow-xl dark:border-white/15 dark:bg-stone-900 dark:text-stone-100"
            >
              <div className="flex items-center justify-between border-b border-stone-200/70 pb-2 dark:border-white/10">
                <div>
                  <div className="text-xs font-semibold">Demo controls</div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Stream SKILL.md or inspect raw markdown
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerReplayStream();
                    setDemoOpen(false);
                  }}
                  title="Replay streaming Markdown"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-stone-200 hover:bg-stone-100 dark:border-white/12 dark:hover:bg-white/10"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>

              <div className="mt-2.5 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-0.5 dark:bg-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setViewMode("reader")}
                    className={`cursor-pointer rounded-md py-1 text-xs font-medium ${
                      viewMode === "reader"
                        ? "bg-white text-stone-900 shadow-2xs dark:bg-stone-800 dark:text-white"
                        : "text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("raw")}
                    className={`cursor-pointer rounded-md py-1 text-xs font-medium ${
                      viewMode === "raw"
                        ? "bg-white text-stone-900 shadow-2xs dark:bg-stone-800 dark:text-white"
                        : "text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    Markdown
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleCopyAll()}
                    className="flex-1 cursor-pointer rounded-lg border border-stone-200 py-1 text-xs font-medium hover:bg-stone-50 dark:border-white/12 dark:hover:bg-white/10"
                  >
                    {copiedAll ? "Copied ✓" : "Copy .md"}
                  </button>
                  {onDownload && (
                    <button
                      type="button"
                      onClick={onDownload}
                      className="flex-1 cursor-pointer rounded-lg border border-stone-200 py-1 text-xs font-medium hover:bg-stone-50 dark:border-white/12 dark:hover:bg-white/10"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {viewMode === "raw" ? (
        <div
          className={`mx-auto w-full ${
            centeredArticle ? "max-w-none px-5 py-7 sm:px-7" : "p-5"
          } ${maxHeightClass} overflow-y-auto`}
        >
          <MarkdownCodeBlock lang="md" title={title} code={rawSource} />
        </div>
      ) : (
        <article
          className={`mx-auto w-full ${
            centeredArticle
              ? "max-w-none px-5 py-7 sm:px-7 sm:py-8"
              : "max-w-none px-5 py-6 sm:px-7 sm:py-7"
          } ${maxHeightClass} ${
            maxHeightClass ? "overflow-y-auto" : ""
          } ${textSizeClass}`}
        >
          <div
            data-streamdown="root"
            className="flex flex-col gap-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
          >
            {blocks.map((block, idx) => {
              if (block.type === "frontmatter" && block.frontmatter) {
                const descVal = (block.frontmatter.description || "")
                  .replace(/\s+[—–]\s+/g, ": ")
                  .replace(/[—–]/g, ", ");
                if (!descVal) return null;
                return (
                  <p
                    key={idx}
                    className="border-b border-neutral-200/70 pb-3 text-[14px] leading-relaxed text-neutral-600 dark:border-white/[0.08] dark:text-neutral-300"
                  >
                    {descVal}
                  </p>
                );
              }

              if (block.type === "h1") {
                return (
                  <MarkdownHeading
                    key={idx}
                    level={1}
                    text={block.text || ""}
                    anchors={anchors}
                    enableTextReveal={enableTextReveal}
                    sources={sources}
                  />
                );
              }

              if (block.type === "h2") {
                return (
                  <MarkdownHeading
                    key={idx}
                    level={2}
                    text={block.text || ""}
                    anchors={anchors}
                    enableTextReveal={false}
                    sources={sources}
                  />
                );
              }

              if (block.type === "h3") {
                return (
                  <MarkdownHeading
                    key={idx}
                    level={3}
                    text={block.text || ""}
                    anchors={anchors}
                    enableTextReveal={false}
                    sources={sources}
                  />
                );
              }

              if (block.type === "alert") {
                return (
                  <MarkdownAlert
                    key={idx}
                    kind={block.alertKind}
                    title={block.alertTitle}
                    text={block.text || ""}
                    sources={sources}
                  />
                );
              }

              if (block.type === "blockquote") {
                return (
                  <MarkdownAlert
                    key={idx}
                    kind="TIP"
                    title="Tip"
                    text={block.text || ""}
                    sources={sources}
                  />
                );
              }

              if (block.type === "table") {
                return (
                  <MarkdownTable
                    key={idx}
                    headers={block.headers || []}
                    rows={block.rows || []}
                    sources={sources}
                  />
                );
              }

              if (block.type === "code") {
                return (
                  <MarkdownCodeBlock
                    key={idx}
                    lang={block.lang}
                    title={block.codeTitle}
                    code={block.text || ""}
                  />
                );
              }

              if (block.type === "image") {
                return (
                  <MarkdownImage
                    key={idx}
                    src={block.src || ""}
                    alt={block.alt}
                  />
                );
              }

              if (block.type === "tasklist") {
                return (
                  <ul key={idx} className="space-y-2.5 pl-0.5">
                    {(block.tasks || []).map((task, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.checked}
                          readOnly
                          tabIndex={-1}
                          aria-label={task.text}
                          className="mt-1.5 size-4 shrink-0 rounded border-stone-300 accent-emerald-600 dark:border-white/20"
                        />
                        <span
                          className={
                            task.checked
                              ? "text-stone-500 line-through dark:text-stone-400"
                              : "text-stone-700 dark:text-stone-200"
                          }
                        >
                          {renderInlineMarkdown(task.text, sources)}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }

              if (block.type === "ul") {
                return (
                  <ul
                    key={idx}
                    className="list-disc space-y-3 pl-5 text-[14.5px] leading-[1.85] text-neutral-700 marker:text-neutral-400 dark:text-neutral-200 dark:marker:text-neutral-500"
                  >
                    {(block.items || []).map((item, liIdx) => (
                      <li key={liIdx} className="pl-1.5 leading-[1.85]">
                        {renderInlineMarkdown(item, sources)}
                      </li>
                    ))}
                  </ul>
                );
              }

              if (block.type === "ol") {
                return (
                  <ol
                    key={idx}
                    className="list-decimal space-y-3.5 pl-5 text-[14.5px] leading-[1.85] text-neutral-700 marker:font-semibold marker:text-neutral-500 dark:text-neutral-200 dark:marker:text-neutral-400"
                  >
                    {(block.items || []).map((item, liIdx) => (
                      <li key={liIdx} className="pl-1.5 leading-[1.85]">
                        {renderInlineMarkdown(item, sources)}
                      </li>
                    ))}
                  </ol>
                );
              }

              if (block.type === "hr") {
                return (
                  <hr
                    key={idx}
                    className="my-2 border-stone-200/80 dark:border-white/[0.08]"
                  />
                );
              }

              return (
                <p
                  key={idx}
                  className="text-pretty text-stone-700 dark:text-stone-200"
                >
                  {renderInlineMarkdown(block.text || "", sources)}
                </p>
              );
            })}

            {isActivelyStreaming && (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-1.5 animate-pulse rounded-xs bg-emerald-500 align-middle"
              />
            )}
          </div>
        </article>
      )}
    </div>
  );
}

export default Markdown;
