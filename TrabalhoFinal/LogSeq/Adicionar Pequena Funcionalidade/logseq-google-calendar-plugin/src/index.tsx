import React from "react";
import ReactDOM from "react-dom/client";

// This file registers a panel with Logseq using vite-plugin-logseq conventions.
// The actual registration is performed by the plugin runtime; here we expose a
// global mount function that the Logseq bootstrap can call.

export async function mountExecutionPanel(container: HTMLElement) {
  // Lazy-load the panel to keep the initial bundle small. This creates a separate
  // chunk for the UI code so the host (Logseq) only downloads it on demand.
  const { default: ExecutionPanel } = await import("./components/ExecutionPanel");
  const root = ReactDOM.createRoot(container);
  root.render(<ExecutionPanel />);
}

// For local dev (vite) we can auto-mount into document body for preview
if (import.meta.env.DEV) {
  const wrapper = document.createElement("div");
  wrapper.className = "min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6";
  document.body.appendChild(wrapper);
  const el = document.createElement("div");
  wrapper.appendChild(el);
  // Keep dev preview experience fast by lazy-loading the panel as well.
  mountExecutionPanel(el);
}
