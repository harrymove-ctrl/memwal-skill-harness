export type Theme = "dark" | "light";

/** Same key as src/App.tsx, so a stored choice carries over. */
export const THEME_STORAGE_KEY = "memwal_skill_harness_theme_v1";

/**
 * The theme to start with: the ?theme= override, then the stored choice, then
 * dark. Storage can throw in a private window, and that must never block render.
 */
export function initialTheme(): Theme {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get("theme");
    if (fromQuery === "dark" || fromQuery === "light") return fromQuery;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The class is already applied; only persistence is lost.
  }
}
