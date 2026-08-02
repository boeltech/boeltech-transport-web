import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry } from "@shared/observability/sentry";
import config from "@shared/config/env";
import { bootstrapAuthInterceptors } from "./bootstrapAuthInterceptors";
import "./styles/index.css";
import App from "./App";

initSentry();
bootstrapAuthInterceptors();

if (typeof document !== "undefined" && config.app.name) {
  document.title = config.app.name;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
