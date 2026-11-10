import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./Root";
import { handleEnokiOAuthHashRedirectIfPresent } from "./lib/walletAuth";
import { applyTheme, initialTheme } from "./shell";
import "./index.css";

if (!handleEnokiOAuthHashRedirectIfPresent()) {
  // Before the first paint, so a dark page never flashes light.
  applyTheme(initialTheme());
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
