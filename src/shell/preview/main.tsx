/*
 * Dev only: open /src/shell/preview/index.html on the dev server. It is not a
 * Rollup input, so it never reaches the production build. Sample names exist to
 * exercise layout; nothing here is read from a real space.
 *
 * ?state=normal|long|viewer|signedout|signedoutnosignin|nospace|tall
 * ?theme=dark|light
 */
import { type ReactNode, StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import { AppShell, type AppShellProps } from "../AppShell";
import { Button } from "../Button";
import { PLACE_LABELS, type Place } from "../places";
import { applyTheme, initialTheme, type Theme } from "../theme";

declare global {
  interface Window {
    __shellEvents: string[];
  }
}
window.__shellEvents = [];
const log = (event: string) => window.__shellEvents.push(event);

const LONG_NAME = "memwal-team-skills-for-the-very-long-namespace-name-that-a-real-team-could-type-2026";
const LONG_ADDRESS = "0x463e8c1f0a9b7d2e4f6a8c0e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5eeb1d";

type Scenario = Pick<AppShellProps, "space" | "spaces" | "member"> & {
  canCreate: boolean;
  canSignIn?: boolean;
  title?: string;
  tall?: boolean;
};

const BASE_SPACES = [
  { name: "memwal-team-skills", skillCount: 19 },
  { name: "sample-space", skillCount: 1 },
  { name: "empty-space", skillCount: 0 },
];

const SCENARIOS: Record<string, Scenario> = {
  normal: {
    space: BASE_SPACES[0]!,
    spaces: BASE_SPACES,
    member: { handle: "harrymove-ctrl", role: "Owner" },
    canCreate: true,
  },
  long: {
    space: { name: LONG_NAME, skillCount: 12345 },
    spaces: Array.from({ length: 30 }, (_, i) => ({ name: `${LONG_NAME}-${i}`, skillCount: i * 41 })).concat({
      name: LONG_NAME,
      skillCount: 12345,
    }),
    member: { handle: LONG_ADDRESS, role: "Editor" },
    canCreate: true,
    title: "A very long page title that a real skill name could produce when it opens a document in the app shell",
  },
  viewer: {
    space: BASE_SPACES[1]!,
    spaces: BASE_SPACES,
    member: { handle: "teammate-with-a-long-handle-name-for-testing", role: "Viewer" },
    canCreate: false,
  },
  signedout: {
    space: BASE_SPACES[0]!,
    spaces: BASE_SPACES,
    member: null,
    canCreate: false,
    canSignIn: true,
  },
  signedoutnosignin: {
    space: BASE_SPACES[0]!,
    spaces: BASE_SPACES,
    member: null,
    canCreate: false,
  },
  nospace: {
    space: null,
    spaces: [],
    member: { handle: "harrymove-ctrl", role: "Owner" },
    canCreate: true,
  },
  tall: {
    space: BASE_SPACES[0]!,
    spaces: BASE_SPACES,
    member: { handle: "harrymove-ctrl", role: "Owner" },
    canCreate: true,
    tall: true,
  },
};

function Placeholder({ place, tall }: { place: Place | null; tall?: boolean }): ReactNode {
  const rows = tall ? 40 : 3;
  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }} data-testid="preview-content">
      <p style={{ margin: 0, color: "var(--cc-ink-2)" }}>
        {place ? `${PLACE_LABELS[place]} renders here as AppShell children.` : "A page outside the five places."}
      </p>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{
            height: 72,
            borderRadius: "var(--cc-radius-md)",
            border: "1px solid var(--cc-line)",
            background: "var(--cc-surface-2)",
          }}
        />
      ))}
    </div>
  );
}

function Preview() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const scenario = SCENARIOS[params.get("state") ?? "normal"] ?? SCENARIOS.normal!;
  const [place, setPlace] = useState<Place | null>(params.get("place") === "none" ? null : "home");
  const [spaceName, setSpaceName] = useState(scenario.space?.name ?? null);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [member, setMember] = useState(scenario.member);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const space = scenario.spaces.find((item) => item.name === spaceName) ?? scenario.space;

  return (
    <AppShell
      place={place}
      onNavigate={(next) => {
        log(`navigate:${next}`);
        setPlace(next);
      }}
      space={space}
      spaces={scenario.spaces}
      onSwitchSpace={(name) => {
        log(`switch:${name}`);
        setSpaceName(name);
      }}
      onNewSpace={scenario.canCreate ? () => log("new-space") : undefined}
      member={member}
      onSignOut={() => {
        log("sign-out");
        setMember(null);
      }}
      onSignIn={scenario.canSignIn ? () => log("sign-in") : undefined}
      theme={theme}
      onToggleTheme={() => {
        log("toggle-theme");
        setTheme((value) => (value === "dark" ? "light" : "dark"));
      }}
      title={scenario.title ?? (place ? PLACE_LABELS[place] : "Page")}
      toolbar={
        <>
          <Button>Proof</Button>
          <Button variant="primary">Invite</Button>
        </>
      }
      actions={<Button>Share</Button>}
    >
      <Placeholder place={place} tall={scenario.tall} />
    </AppShell>
  );
}

// Before the first paint, so a dark page never flashes light.
applyTheme(initialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
