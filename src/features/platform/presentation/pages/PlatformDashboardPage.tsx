import { isPlatformConsoleV1Enabled } from "../ops/platformConsoleV1";
import { PlatformHoyPage } from "../ops/PlatformHoyPage";
import { PlatformPulsePage } from "./PlatformPulsePage";

/**
 * Landing /platform — Pulso (ADR-0097) o Hoy (consola v1 D4) según flag.
 */
export function PlatformDashboardPage() {
  if (isPlatformConsoleV1Enabled()) {
    return <PlatformHoyPage />;
  }
  return <PlatformPulsePage />;
}
