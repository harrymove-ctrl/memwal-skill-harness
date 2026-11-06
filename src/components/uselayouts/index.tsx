"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronDown,
  FolderGit2,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 1. @uselayouts/discrete-tabs
 * Spring-animated pill tabs with layoutId shared indicator for clean mode & view switching.
 */
export interface DiscreteTabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export function DiscreteTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  layoutId = "uselayouts-discrete-tabs",
  size = "sm",
  className,
}: {
  items: DiscreteTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  layoutId?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-neutral-200/80 bg-neutral-100/80 p-1 dark:border-white/10 dark:bg-white/[0.04]",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg font-medium transition-colors select-none",
              size === "xs" && "h-6 px-2 text-[11px]",
              size === "sm" && "h-7 px-2.5 text-xs",
              size === "md" && "h-8 px-3.5 text-xs",
              isActive
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 36,
                  mass: 0.7,
                }}
                className="absolute inset-0 rounded-lg border border-neutral-200/90 bg-white shadow-xs dark:border-white/15 dark:bg-neutral-900"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {item.icon}
              <span className="font-semibold tracking-tight">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-neutral-200/70 text-neutral-600 dark:bg-white/10 dark:text-neutral-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 2. @uselayouts/smooth-dropdown
 * Spring-animated popover selector with hover highlight pill and optional footer action.
 */
export interface SmoothDropdownOption {
  value: string;
  label: string;
  meta?: string;
  badge?: string;
}

export function SmoothDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  prefixLabel,
  icon,
  actionLabel,
  onAction,
  footerAction,
  className,
  testId,
}: {
  value: string;
  options: SmoothDropdownOption[];
  onChange: (next: string) => void;
  ariaLabel?: string;
  prefixLabel?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  footerAction?: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredVal, setHoveredVal] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selected =
    options.find((o) => o.value === value) || {
      value,
      label: value,
    };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200/90 bg-white/90 px-2.5 text-xs font-medium text-neutral-900 shadow-2xs transition hover:border-neutral-300 dark:border-white/12 dark:bg-neutral-900/90 dark:text-neutral-100 dark:hover:border-white/25"
      >
        {icon || <FolderGit2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
        {prefixLabel && (
          <span className="font-mono text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
            {prefixLabel}
          </span>
        )}
        <span className="max-w-[165px] truncate font-mono text-xs font-bold">
          {selected.label}
        </span>
        {selected.badge && (
          <span className="rounded-md bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            {selected.badge}
          </span>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-neutral-400"
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 480, damping: 32 }}
            className="absolute left-0 z-50 mt-1.5 min-w-[230px] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/12 dark:bg-neutral-900/95"
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                const isHovered = hoveredVal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseEnter={() => setHoveredVal(opt.value)}
                    onMouseLeave={() => setHoveredVal(null)}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition"
                  >
                    {(isHovered || isSelected) && (
                      <motion.span
                        layoutId="smooth-dropdown-highlight"
                        transition={{
                          type: "spring",
                          stiffness: 520,
                          damping: 36,
                        }}
                        className={cn(
                          "absolute inset-0 rounded-xl",
                          isSelected
                            ? "bg-emerald-500/12 dark:bg-emerald-500/18"
                            : "bg-neutral-100 dark:bg-white/[0.06]"
                        )}
                      />
                    )}
                    <span className="relative z-10 flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "truncate font-mono text-xs",
                          isSelected
                            ? "font-bold text-emerald-800 dark:text-emerald-200"
                            : "font-medium text-neutral-700 dark:text-neutral-200"
                        )}
                      >
                        {opt.label}
                      </span>
                    </span>
                    <span className="relative z-10 flex shrink-0 items-center gap-1.5">
                      {opt.meta && (
                        <span className="font-mono text-[10px] text-neutral-400">
                          {opt.meta}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {(footerAction || (actionLabel && onAction)) && (
              <div
                onClick={() => setOpen(false)}
                className="mt-1 border-t border-neutral-200/70 pt-1 dark:border-white/10"
              >
                {footerAction || (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onAction?.();
                    }}
                    className="flex w-full cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
                  >
                    <Plus className="size-3.5" />
                    <span>{actionLabel}</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 3. @uselayouts/inline-edit
 * Click-to-edit inline text field with smooth spring morphing and Enter/Escape support.
 */
export function InlineRuleEdit({
  value,
  onSave,
  disabled = false,
  className,
}: {
  value: string;
  onSave: (nextValue: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setDraft(value);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div
        className={cn(
          "group/inline inline-flex min-w-0 items-center gap-1.5",
          className
        )}
      >
        <span className="text-xs leading-snug font-medium text-neutral-900 dark:text-neutral-100">
          {value}
        </span>
        {!disabled && (
          <button
            type="button"
            title="Edit rule inline"
            onClick={() => setEditing(true)}
            className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 opacity-0 transition group-hover/inline:opacity-100 hover:bg-neutral-200/70 hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0.8, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex w-full items-center gap-1.5"
    >
      <input
        ref={inputRef}
        type="text"
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-7 flex-1 rounded-lg border border-emerald-500/60 bg-white px-2.5 text-xs font-medium text-neutral-900 outline-none ring-2 ring-emerald-500/15 dark:bg-neutral-900 dark:text-white"
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => void commit()}
        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2 text-[11px] font-semibold text-white hover:bg-emerald-500"
      >
        {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
        <span>Save</span>
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setDraft(value);
          setEditing(false);
        }}
        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/10"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}

/**
 * 4. @uselayouts/save-button
 * Morphing multi-state action button (idle -> saving -> saved).
 */
export function SaveButton({
  state = "idle",
  idleLabel = "Save",
  savingLabel = "Saving…",
  savedLabel = "Saved",
  icon,
  onClick,
  disabled,
  className,
  testId,
}: {
  state?: "idle" | "saving" | "saved" | "conflict" | "failed";
  idleLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  testId?: string;
}) {
  return (
    <motion.button
      type="button"
      data-testid={testId}
      whileTap={{ scale: 0.97 }}
      disabled={disabled || state === "saving"}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xl px-3.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        state === "saved"
          ? "bg-emerald-600 text-white shadow-xs"
          : state === "conflict" || state === "failed"
            ? "bg-amber-600 text-white"
            : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "saving" ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="inline-flex items-center gap-1.5"
          >
            <Loader2 className="size-3.5 animate-spin" />
            <span>{savingLabel}</span>
          </motion.span>
        ) : state === "saved" ? (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-1.5"
          >
            <Check className="size-3.5" />
            <span>{savedLabel}</span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="inline-flex items-center gap-1.5"
          >
            {icon || <Sparkles className="size-3.5" />}
            <span>{idleLabel}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * 5. @uselayouts/filter-interaction
 * Compact animated category filter pills for the Skills sidebar.
 */
export function FilterPills({
  categories,
  activeCategory,
  onSelect,
  className,
}: {
  categories: string[];
  activeCategory: string;
  onSelect: (cat: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {categories.map((cat) => {
        const active = cat === activeCategory;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className={cn(
              "relative cursor-pointer rounded-lg px-2 py-1 text-[11px] font-medium transition select-none",
              active
                ? "text-emerald-950 dark:text-emerald-200"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            {active && (
              <motion.span
                layoutId="uselayouts-filter-pill"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
                className="absolute inset-0 rounded-lg border border-emerald-500/30 bg-emerald-500/15 dark:bg-emerald-500/20"
              />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        );
      })}
    </div>
  );
}
