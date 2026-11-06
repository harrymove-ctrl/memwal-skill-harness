/*
 * Dev only: open /src/shell/preview/logo.html on the dev server to see the glint
 * at every size. ?theme=dark|light  ?sizes=96,64  Not part of the production build.
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import "../shell.css";
import { Button } from "../Button";
import { LogoMark } from "../Logo";
import { applyTheme, initialTheme } from "../theme";

const params = new URLSearchParams(window.location.search);
const SIZES = (params.get("sizes") ?? "128,96,64,48,32,24,16").split(",").map(Number);

function Preview() {
  const [run, setRun] = useState(0);
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 32,
        boxSizing: "border-box",
        display: "grid",
        gap: 32,
        alignContent: "start",
        background: "var(--cc-bg)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
        {SIZES.map((size) => (
          <LogoMark key={size} size={size} glint glintKey={run} className="cc-brand__mark" />
        ))}
      </div>
      <div>
        <Button onClick={() => setRun((value) => value + 1)} data-testid="glint-replay">
          Play again
        </Button>
      </div>
    </main>
  );
}

applyTheme(initialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
