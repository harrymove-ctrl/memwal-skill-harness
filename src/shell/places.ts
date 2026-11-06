export type Place = "home" | "skills" | "try" | "team" | "agents";

export const PLACES: readonly Place[] = ["home", "skills", "try", "team", "agents"];

export const PLACE_PATHS: Record<Place, string> = {
  home: "/home",
  skills: "/skills",
  try: "/try",
  team: "/team",
  agents: "/agents",
};

export const PLACE_LABELS: Record<Place, string> = {
  home: "Home",
  skills: "Skills",
  try: "Try it",
  team: "Team",
  agents: "Agents",
};

/** Old links keep working: each one lands on the place that replaced it. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/graph": "/skills",
  "/eval": "/try",
  "/cad": "/agents",
};

function normalize(path: string): string {
  const bare = path.split(/[?#]/)[0] ?? "";
  return bare.length > 1 ? bare.replace(/\/+$/, "") || "/" : bare;
}

/** The path a URL should end up on, after applying any legacy redirect. */
export function resolvePath(path: string): string {
  const bare = normalize(path);
  return LEGACY_REDIRECTS[bare] ?? bare;
}

/** The place for a path, or null for a path outside the five, such as /bento or /. */
export function placeFromPath(path: string): Place | null {
  const resolved = resolvePath(path);
  return PLACES.find((place) => PLACE_PATHS[place] === resolved) ?? null;
}
