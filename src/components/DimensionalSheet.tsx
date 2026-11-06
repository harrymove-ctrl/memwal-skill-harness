import React, { useId } from "react";
import { FillPattern } from "@/lib/dither";
import type { FlowMemoryNode, HostedSkillNode } from "../types";

interface DimensionalSheetProps {
  namespace: string;
  skill: HostedSkillNode;
  flows: FlowMemoryNode[];
}

export const DimensionalSheet: React.FC<DimensionalSheetProps> = ({
  namespace,
  skill,
  flows,
}) => {
  const uid = useId().replace(/:/g, "");
  const gradId = `${uid}-dither-grad`;
  const dotId = `${uid}-dither-dot`;

  return (
    <div className="sheetwrap">
      <div className="scroll">
        <svg
          viewBox="0 0 1700 940"
          role="img"
          aria-label="Dimensional drawing sheet: plan view, shadow envelope, exploded layer stack, nested corner radius detail, and variable formula tables"
        >
          <defs>
            <FillPattern
              id={gradId}
              fill="gradient"
              color="blue"
              cell={3}
              level={0.35}
              floor={0.0625}
            />
            <FillPattern id={dotId} fill="dotted" color="grey" cell={3} />
            <pattern
              id="sheet-hatch"
              width="7"
              height="7"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="7"
                stroke="var(--ink)"
                strokeWidth="0.7"
                strokeOpacity="0.38"
              />
            </pattern>
            <marker
              id="dim-arrow-end"
              viewBox="0 0 10 6"
              refX="9"
              refY="3"
              markerWidth="7"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0,0 L10,3 L0,6 z" fill="var(--ink)" />
            </marker>
            <marker
              id="dim-arrow-start"
              viewBox="0 0 10 6"
              refX="1"
              refY="3"
              markerWidth="7"
              markerHeight="5"
              orient="auto"
            >
              <path d="M10,0 L0,3 L10,6 z" fill="var(--ink)" />
            </marker>
          </defs>

          {/* Outer sheet border */}
          <rect
            x="16"
            y="16"
            width="1668"
            height="908"
            rx="14"
            className="border"
          />

          {/* ==============================================================
              TOP-LEFT: ARCHITECTURAL NOTES & BOXED CALLOUTS [1]..[5]
             ============================================================== */}
          <g transform="translate(42, 48)">
            <text x="0" y="0" className="nth">
              ARCHITECTURAL NOTES · DWG MEMWAL-SKILL-001
            </text>
            <g transform="translate(0, 20)">
              <rect x="0" y="-11" width="18" height="15" className="nb" />
              <text x="9" y="0" textAnchor="middle" className="nbt">
                1
              </text>
              <text x="26" y="0" className="nt">
                NAMESPACE ({namespace.toUpperCase()}) · S1 = 14px PAD
              </text>
            </g>
            <g transform="translate(0, 42)">
              <rect x="0" y="-11" width="18" height="15" className="nb" />
              <text x="9" y="0" textAnchor="middle" className="nbt">
                2
              </text>
              <text x="26" y="0" className="nt">
                SKILL SLOT ([SKILL:{skill.id.toUpperCase()}]) · R1 = 16px
              </text>
            </g>
            <g transform="translate(0, 64)">
              <rect x="0" y="-11" width="18" height="15" className="nb" />
              <text x="9" y="0" textAnchor="middle" className="nbt">
                3
              </text>
              <text x="26" y="0" className="nt">
                FLOW MEMORY WELL · R2 = R1 − B − S6 = 11px
              </text>
            </g>
            <g transform="translate(0, 86)">
              <rect x="0" y="-11" width="18" height="15" className="nb" />
              <text x="9" y="0" textAnchor="middle" className="nbt">
                4
              </text>
              <text x="26" y="0" className="nt">
                DELEGATE KEY HEADER · H1 = 2·S1 + H3 = 64px
              </text>
            </g>
            <g transform="translate(0, 108)">
              <rect x="0" y="-11" width="18" height="15" className="nb" />
              <text x="9" y="0" textAnchor="middle" className="nbt">
                5
              </text>
              <text x="26" y="0" className="nt">
                NEWEST-WINS OVERRIDE · SEAL DECRYPTED AT RECALL
              </text>
            </g>
          </g>

          {/* ==============================================================
              BOTTOM-LEFT: SHADOW & SEAL ENVELOPE (E1 / E2 / E3)
             ============================================================== */}
          <g transform="translate(42, 230)">
            <text x="0" y="0" className="vt">
              FIG A · SEAL ENCRYPTION &amp; SHADOW ENVELOPE (E1, E2, E3)
            </text>
            {/* Outer dash-dot envelope */}
            <rect
              x="16"
              y="24"
              width="380"
              height="220"
              rx="22"
              className="env"
            />
            {/* Dithered + Hatched shadow footprint */}
            <rect
              x="30"
              y="38"
              width="352"
              height="192"
              rx="16"
              fill={`url(#${dotId})`}
              stroke="var(--ink)"
              strokeWidth="0.9"
            />
            {/* Core card outline */}
            <rect
              x="44"
              y="48"
              width="324"
              height="168"
              rx="16"
              className="obj"
            />
            <text x="206" y="126" textAnchor="middle" className="nt">
              WALRUS BLOB FOOTPRINT
            </text>
            <text x="206" y="144" textAnchor="middle" className="dts">
              E1 = BL + SP − Y · E2 = BL + SP · E3 = BL + SP + Y
            </text>
            <text x="206" y="266" textAnchor="middle" className="dts">
              ENVELOPE MARGIN · DO NOT CLIP WITHIN E3 = 26px
            </text>
          </g>

          {/* ==============================================================
              BOTTOM-LEFT LOWER: EXPLODED LAYER STACK (3D ISOMETRIC SCHEMATIC)
             ============================================================== */}
          <g transform="translate(42, 545)">
            <text x="0" y="0" className="vt">
              FIG B · EXPLODED Z-LAYER STACK (SKILL + FLOW + VERDICT)
            </text>

            {/* Layer Z0: Base SKILL.md */}
            <polygon
              points="60,250 280,195 410,245 190,300"
              fill="var(--fill)"
              stroke="var(--ink)"
              strokeWidth="1.3"
            />
            <text x="225" y="252" textAnchor="middle" className="sl">
              Z0 · BASE [SKILL:{skill.id.toUpperCase()}] (STATIC)
            </text>

            {/* Layer Z1: Walrus Flow Memory Blobs (Dithered) */}
            <polygon
              points="60,175 280,120 410,170 190,225"
              fill={`url(#${gradId})`}
              stroke="var(--ink)"
              strokeWidth="1.3"
            />
            <rect
              x="115"
              y="155"
              width="215"
              height="20"
              fill="var(--sheet)"
              stroke="var(--ink)"
              strokeWidth="0.8"
            />
            <text x="222" y="169" textAnchor="middle" className="sl">
              Z1 · WALRUS [FLOW] BLOBS (×{flows.length} SEAL)
            </text>

            {/* Layer Z2: Compiled Agent Trajectory Verdict */}
            <polygon
              points="60,100 280,45 410,95 190,150"
              fill="var(--sheet)"
              stroke="var(--ink)"
              strokeWidth="1.6"
            />
            <text x="235" y="102" textAnchor="middle" className="nt">
              Z2 · COMPILED SKILL.MD + RECALL TRACE
            </text>

            {/* Vertical Z-axis dash-dot guide lines */}
            <line x1="60" y1="100" x2="60" y2="250" className="cl" />
            <line x1="410" y1="95" x2="410" y2="245" className="cl" />
            <text x="424" y="175" className="dts">
              ΔZ = 75px
            </text>
          </g>

          {/* ==============================================================
              CENTER: PLAN VIEW (1:1 ARCHITECTURAL WIREFRAME OF HARNESS CARD)
             ============================================================== */}
          <g transform="translate(520, 48)">
            <text x="310" y="0" textAnchor="middle" className="vt">
              PLAN VIEW · HARNESS CARD ARCHITECTURE (SCALE 1:1)
            </text>

            {/* Top Overall Width Dimension Line W = 620 */}
            <line x1="0" y1="24" x2="0" y2="54" className="ext" />
            <line x1="620" y1="24" x2="620" y2="54" className="ext" />
            <line
              x1="4"
              y1="36"
              x2="616"
              y2="36"
              className="dl"
              markerStart="url(#dim-arrow-start)"
              markerEnd="url(#dim-arrow-end)"
            />
            <text x="310" y="32" textAnchor="middle" className="dt">
              W · card-w = 420–680 (REF 620)
            </text>

            {/* Outer Container R1 = 16 */}
            <rect
              x="0"
              y="56"
              width="620"
              height="540"
              rx="16"
              className="obj"
            />

            {/* Centerlines */}
            <line x1="310" y1="44" x2="310" y2="612" className="cl" />
            <line x1="-14" y1="326" x2="634" y2="326" className="cl" />

            {/* Header Region H1 = 2*S1 + H3 = 64 */}
            <rect
              x="14"
              y="70"
              width="592"
              height="64"
              rx="10"
              className="well"
            />
            {/* Lead Icon Slot Z1 */}
            <rect x="28" y="84" width="36" height="36" rx="6" className="hug" />
            <line x1="28" y1="84" x2="64" y2="120" className="thin" />
            <line x1="64" y1="84" x2="28" y2="120" className="thin" />

            {/* Title Slot · FLEX */}
            <rect
              x="76"
              y="84"
              width="356"
              height="36"
              rx="4"
              className="slot"
            />
            <text x="254" y="106" textAnchor="middle" className="sl">
              TITLE SLOT · FLEX ([SKILL:{skill.id.toUpperCase()}])
            </text>

            {/* Action Slot · HUG */}
            <rect
              x="444"
              y="84"
              width="148"
              height="36"
              rx="18"
              className="hug"
            />
            <text x="518" y="106" textAnchor="middle" className="sl">
              ACTION · HUG (R4=H3÷2)
            </text>

            {/* Callout [4] on Header */}
            <rect x="580" y="58" width="18" height="15" className="nb" />
            <text x="589" y="69" textAnchor="middle" className="nbt">
              4
            </text>

            {/* Step 1 + Step 2 Recall Well R2 = R1 - B - S6 = 11 */}
            <rect
              x="18"
              y="148"
              width="584"
              height="176"
              rx="11"
              className="well"
            />
            <text x="34" y="168" className="dts">
              INNER WELL · R2 = R1 − B − S6 = 11px · S2 = 12px PAD
            </text>

            {/* Flow Memory Slots inside Well (Dithered with FillPattern) */}
            <rect
              x="30"
              y="178"
              width="560"
              height="62"
              rx="6"
              fill={`url(#${gradId})`}
              stroke="var(--ink)"
              strokeWidth="1"
            />
            <rect
              x="95"
              y="186"
              width="430"
              height="46"
              rx="4"
              fill="var(--sheet)"
              stroke="var(--ink)"
              strokeWidth="0.7"
            />
            <text x="310" y="206" textAnchor="middle" className="nt">
              WALRUS FLOW MEMORY SLOT · FILL (×{flows.length} ACTIVE BLOBS)
            </text>
            <text x="310" y="224" textAnchor="middle" className="dts">
              SORT = RECENT · SEAL SESSION TTL = 5m · DELEGATE KEY VERIFIED
            </text>

            <rect
              x="30"
              y="250"
              width="560"
              height="60"
              rx="6"
              className="slot"
            />
            <text x="310" y="284" textAnchor="middle" className="sl">
              &lt;THINK&gt; TRAJECTORY RECONCILIATION SLOT · FLEX · WRAPS
            </text>

            {/* Step 4 Side-by-Side A/B Verdict Slots */}
            <rect
              x="18"
              y="338"
              width="286"
              height="152"
              rx="11"
              className="slot"
            />
            <text x="161" y="408" textAnchor="middle" className="sl">
              COLD AGENT SLOT · 0.5·FILL
            </text>
            <text x="161" y="426" textAnchor="middle" className="dts">
              STATIC SKILL.MD ONLY (STALE)
            </text>

            <rect
              x="316"
              y="338"
              width="286"
              height="152"
              rx="11"
              className="obj"
            />
            <text x="459" y="408" textAnchor="middle" className="nt">
              WALRUS RECALL SLOT · 0.5·FILL
            </text>
            <text x="459" y="426" textAnchor="middle" className="dts">
              BASE SKILL + [FLOW] OVERRIDE
            </text>

            {/* Footer Teach Skill Bar H2 */}
            <rect
              x="18"
              y="504"
              width="584"
              height="74"
              rx="11"
              className="hug"
            />
            <text x="310" y="544" textAnchor="middle" className="nt">
              FOOTER INPUT SLOT · TEACH SKILL (+ COMMIT [FLOW] VIA DELEGATE KEY)
            </text>

            {/* Dashed Detail Circle C on Top-Left Corner */}
            <circle
              cx="18"
              cy="70"
              r="28"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1"
              strokeDasharray="5 3"
            />
            <text x="52" y="50" className="dts">
              SEE DETAIL C (3:1)
            </text>
          </g>

          {/* ==============================================================
              BOTTOM-CENTER: DETAIL C (3:1 NESTED CORNER RADIUS R2 = R1 - B - S6)
             ============================================================== */}
          <g transform="translate(520, 685)">
            <text x="0" y="0" className="vt">
              DETAIL C · NESTED CORNER GEOMETRY (SCALE 3:1)
            </text>
            <rect
              x="0"
              y="16"
              width="270"
              height="180"
              rx="10"
              className="well"
            />
            {/* Outer corner arc R1 */}
            <path
              d="M 36,170 L 36,86 A 48,48 0 0,1 84,38 L 230,38"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2"
            />
            {/* Inner well corner arc R2 */}
            <path
              d="M 54,170 L 54,92 A 33,33 0 0,1 87,59 L 230,59"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeDasharray="5 3"
            />
            <text x="96" y="96" className="nt">
              R1 = 16px (OUTER)
            </text>
            <text x="96" y="116" className="dts">
              R2 = R1 − B − S6 = 11px
            </text>
            <text x="96" y="136" className="dts">
              S6 = 4px INSET · B = 1px BORDER
            </text>

            {/* Formula Verification Box */}
            <rect
              x="295"
              y="16"
              width="325"
              height="180"
              rx="10"
              className="obj"
            />
            <text x="315" y="42" className="nth">
              DERIVED FORMULA INVARIANTS
            </text>
            <text x="315" y="68" className="tc">
              H1 (header-min) = 2·S1 + H3 = 2·14 + 36 = 64px
            </text>
            <text x="315" y="92" className="tc">
              R2 (well-radius) = R1 − B − S6 = 16 − 1 − 4 = 11px
            </text>
            <text x="315" y="116" className="tc">
              R4 (action-pill) = H3 ÷ 2 = 36 ÷ 2 = 18px
            </text>
            <text x="315" y="140" className="tc">
              MH (max-height) = 100dvh − 2·V1
            </text>
            <text x="315" y="168" className="dts">
              ALL DIMENSIONS IN CSS PX @ 1× · TABULAR-NUMS
            </text>
          </g>

          {/* ==============================================================
              RIGHT COLUMN: VARIABLE SPECIFICATION TABLE (S#, H#, R#, E#)
             ============================================================== */}
          <g transform="translate(1180, 48)">
            <text x="0" y="0" className="vt">
              TABLE 1 · DIMENSIONAL VARIABLES &amp; CODES
            </text>
            <rect
              x="0"
              y="16"
              width="470"
              height="816"
              rx="10"
              className="obj"
            />

            {/* Table Header */}
            <line x1="0" y1="50" x2="470" y2="50" className="thin" />
            <text x="16" y="38" className="th">
              CODE
            </text>
            <text x="90" y="38" className="th">
              VARIABLE
            </text>
            <text x="245" y="38" className="th">
              FORMULA / VALUE
            </text>

            {[
              ["W", "card-w", "420–680 px (FLEX)"],
              ["B", "border-w", "1.2 px solid var(--ink)"],
              ["S1", "container-pad", "14 px"],
              ["S2", "well-pad", "12 px"],
              ["S3", "stack-gap", "10 px"],
              ["S4", "min-gap-flex-hug", "12 px"],
              ["S5", "lead-gap", "12 px"],
              ["S6", "inner-inset", "4 px"],
              ["H1", "header-min", "2·S1 + H3 = 64 px"],
              ["H2", "footer-h", "74 px"],
              ["H3", "action-h", "36 px (HUG)"],
              ["Z1", "lead-slot-sz", "36 × 36 px"],
              ["R1", "r-container", "16 px"],
              ["R2", "r-inner-well", "R1 − B − S6 = 11 px"],
              ["R3", "r-control", "6 px"],
              ["R4", "r-pill", "H3 ÷ 2 = 18 px"],
              ["E1", "env-top", "BL + SP − Y = 14 px"],
              ["E2", "env-side", "BL + SP = 20 px"],
              ["E3", "env-bottom", "BL + SP + Y = 26 px"],
              ["V1", "viewport-margin", "16 px"],
              ["NS", "active-namespace", namespace],
              ["SK", "active-skill-id", skill.id],
              ["FL", "flow-blob-count", `${flows.length} blobs`],
            ].map(([code, variable, val], idx) => {
              const y = 76 + idx * 32;
              return (
                <g key={code}>
                  <line
                    x1="0"
                    y1={y + 10}
                    x2="470"
                    y2={y + 10}
                    stroke="var(--ink3)"
                    strokeOpacity="0.35"
                    strokeWidth="0.7"
                  />
                  <text x="16" y={y} className="nth">
                    {code}
                  </text>
                  <text x="90" y={y} className="tc">
                    {variable}
                  </text>
                  <text x="245" y={y} className="tc">
                    {val}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="foot">
        <span>
          2026-10-27 &nbsp;|&nbsp; UI COMPONENT &amp; MEMORY ARCHITECTURE
          REFERENCE
        </span>
        <span>
          <b>MEMWAL-SKILL-001 · {skill.id.toUpperCase()}, ARCHITECTURE</b>{" "}
          &nbsp;|&nbsp; SHEET 1 OF 1
        </span>
      </div>
    </div>
  );
};
