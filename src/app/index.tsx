import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry } from "@shared/observability/sentry";
import { bootstrapAuthInterceptors } from "./bootstrapAuthInterceptors";
import "./styles/index.css";
import App from "./App";

initSentry();
bootstrapAuthInterceptors();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
