import { createRoot } from "react-dom/client";
import "../kit/stageshow.css";
import "./concepts.css";
import { CONCEPTS } from "./concepts";

const id = (new URLSearchParams(location.search).get("c") ?? "home-calm") as keyof typeof CONCEPTS;
const Concept = CONCEPTS[id] ?? CONCEPTS["home-calm"];

createRoot(document.getElementById("root")!).render(
  <div id="example" style={{ width: 1120 }}>
    <Concept />
  </div>,
);
