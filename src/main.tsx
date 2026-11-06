import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { handleEnokiOAuthHashRedirectIfPresent } from "./lib/walletAuth";
import "./index.css";

if (!handleEnokiOAuthHashRedirectIfPresent()) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
