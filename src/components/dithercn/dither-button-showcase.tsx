"use client";

import React, { useState } from "react";
import { DitherButton } from "./dither-button";
import { FILL_VARIANTS } from "../../lib/dither";
import type { DitherColorName } from "../../lib/dither";

const COLORS: readonly DitherColorName[] = ["blue", "green", "orange", "pink"];

export function DitherButtonPalette() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {FILL_VARIANTS.map((fill) =>
        COLORS.map((color) => (
          <DitherButton key={`${fill}-${color}`} fill={fill} color={color}>
            {fill}
          </DitherButton>
        ))
      )}
      {COLORS.map((color) => (
        <DitherButton key={`outline-${color}`} variant="outline" color={color}>
          outline
        </DitherButton>
      ))}
    </div>
  );
}

export function DitherButtonForm({
  onRotateSealCounter,
}: {
  onRotateSealCounter?: () => void;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex w-full flex-col gap-5 rounded-xl border border-[#111] bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        window.setTimeout(() => {
          setSaving(false);
          onRotateSealCounter?.();
        }, 1800);
      }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[#111]">
          Revoke stale delegate &amp; rotate SEAL counter
        </span>
        <span className="text-sm text-[#666] text-pretty">
          This removes compromised delegate key 0x55c9...478d2 from
          memwal-team-skills and bumps access_counter_version on-chain.
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <DitherButton
          variant="outline"
          color="grey"
          size="sm"
          onClick={() => setSaving(false)}
        >
          Cancel
        </DitherButton>
        <DitherButton
          type="submit"
          color="red"
          fill="hatched"
          size="sm"
          loading={saving}
        >
          {saving ? "Rotating SEAL..." : "Revoke delegate"}
        </DitherButton>
      </div>
    </form>
  );
}

export function DitherButtonLink() {
  return (
    <div className="flex w-full flex-col items-center justify-between gap-5 rounded-xl border border-[#111] bg-white p-5 text-center">
      <div className="flex flex-col gap-1.5">
        <span className="text-lg font-semibold tracking-tight text-[#111] text-balance">
          Dithered components for Walrus Memory Skill Vault
        </span>
        <span className="text-xs text-[#666]">
          Built on the dithercn Bayer matrix &amp; CSS mask engine. Right-click
          or middle-click links with <code className="font-mono">asChild</code>.
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <DitherButton asChild size="lg" bloom="low" color="ink">
          <a href="#workbench">Open Trajectory Workbench</a>
        </DitherButton>
        <DitherButton
          asChild
          size="lg"
          variant="outline"
          fill="dotted"
          color="blue"
        >
          <a href="#cad-sheet">Inspect 1:1 CAD Sheet</a>
        </DitherButton>
      </div>
    </div>
  );
}

export function DitherButtonShowcase() {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label="DitherButton Component Showcase"
      className="mb-5 rounded-[16px] border-[1.2px] border-[color:var(--ink)] bg-[var(--sheet)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="callout-box">DCN</span>
          <span className="font-mono text-xs font-bold tracking-[0.06em] text-[color:var(--ink)] uppercase">
            DITHERCN · DITHER BUTTON ENGINE (BAYER 4×4 BEVEL + 4 FILLS)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <DitherButton color="blue" size="sm">
              Deploy
            </DitherButton>
            <DitherButton variant="outline" fill="dotted" size="sm">
              View logs
            </DitherButton>
            <DitherButton color="green" fill="hatched" size="sm">
              Sync Walrus
            </DitherButton>
            <DitherButton color="orange" fill="solid" size="sm">
              SEAL Verify
            </DitherButton>
          </div>
        </div>

        <DitherButton
          variant="outline"
          color="ink"
          fill="gradient"
          size="sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide Palette & Examples" : "Explore All Fills & Examples"}
        </DitherButton>
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t-[0.8px] border-[color:var(--ink)] pt-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink2)]">
              1. FILLS &amp; COLOURS (gradient · dotted · hatched · solid · outline)
            </div>
            <DitherButtonPalette />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-6">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink2)]">
              2. LOADING IN A FORM (aria-busy + 3-CELL STEP) &amp; AS A LINK (asChild)
            </div>
            <DitherButtonForm />
            <DitherButtonLink />
          </div>
        </div>
      )}
    </section>
  );
}
