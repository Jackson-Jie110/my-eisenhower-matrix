import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

window.onerror = (message, source, line, column, error) => {
  const details = [
    typeof message === "string" ? message : "Unknown error",
    source ? `(${source}:${line}:${column})` : "",
    error?.stack ? `\n${error.stack}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.zIndex = "9999";
  container.style.background = "#FFFFFF";
  container.style.color = "#DC2626";
  container.style.fontSize = "20px";
  container.style.fontWeight = "700";
  container.style.padding = "24px";
  container.style.whiteSpace = "pre-wrap";
  container.style.fontFamily = "Outfit, sans-serif";
  container.textContent = details || "Unexpected error occurred.";

  document.body.innerHTML = "";
  document.body.appendChild(container);
};

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
