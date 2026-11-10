import { lazy, Suspense } from "react";
import { CommandCenter } from "./CommandCenter";

// The older app stays reachable, and stays out of the main bundle for everyone else.
const LegacyApp = lazy(() => import("./App"));

/** True for pages that still belong to the older app. Exported for tests. */
export function usesLegacyApp(pathname: string, search: string): boolean {
  return pathname.replace(/\/+$/, "") === "/bento" || new URLSearchParams(search).has("legacy");
}

export function Root() {
  if (usesLegacyApp(window.location.pathname, window.location.search)) {
    return (
      <Suspense fallback={null}>
        <LegacyApp />
      </Suspense>
    );
  }
  return <CommandCenter />;
}
