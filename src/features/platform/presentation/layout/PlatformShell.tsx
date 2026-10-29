import { usePlatformDocumentChrome } from "./usePlatformDocumentChrome";
import { PlatformOpsShell } from "../ops/PlatformOpsShell";

/**
 * Chrome aislado de `/platform/*` (ADR-0062).
 * Única UI: shell Ops (Primer denso × Mando acero).
 * No monta AppLayout / AuthProvider / PermissionProvider del ERP.
 */
export function PlatformShell() {
  usePlatformDocumentChrome();
  return <PlatformOpsShell />;
}
