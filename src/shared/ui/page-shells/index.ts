/**
 * @shared/ui/page-shells
 *
 * Esqueletos estándar para las páginas del ERP.
 * Cada shell estandariza el patrón visual de un tipo de pantalla,
 * eliminando duplicación entre features.
 *
 * - ListPageShell      → listas con filtros + paginación (CRUD / registry)
 * - DetailPageShell    → detalle con header + alerts + preStats + stats + tabs + metadata
 * - FormPageShell      → edición simple (no wizard)
 * - WizardPageShell    → creación por pasos
 * - SettingsPageShell  → wrapper sobre SettingsLayout
 * - HubPageShell       → hubs de configuración (orientar / nav / guía / lanzar) — ADR-0091 Hub v2
 * - BuilderPageShell   → construcción no lineal (canvas + inspector) — ADR-0091
 * - WorkbenchPageShell → centros operativos (triage + buckets) — ADR-0090
 *
 * Guía wizards: ./README.md
 * ADR workbench: D:\cowork\boeltech\erp-transport\design\adr\0090-workbench-page-shell-taxonomia-pantallas.md
 * ADR builder:   D:\cowork\boeltech\erp-transport\design\adr\0091-taxonomia-superficies-hub-builder-workbench.md
 */

export { ListPageShell } from "./ListPageShell";
export type {
  ListPageShellPagination,
  ListPageShellPrimaryAction,
  ListPageShellProps,
  ListPageShellToolbar,
} from "./ListPageShell";

export { DetailPageShell } from "./DetailPageShell";
export type {
  DetailPageShellHeader,
  DetailPageShellProps,
  DetailPageShellTabItem,
  DetailPageShellTabs,
} from "./DetailPageShell";

export { FormPageShell } from "./FormPageShell";
export type { FormPageShellHeader, FormPageShellProps } from "./FormPageShell";

export { WizardPageShell } from "./WizardPageShell";
export type {
  WizardFormRef,
  WizardPageShellHeader,
  WizardPageShellProps,
  WizardStepRenderHelpers,
} from "./WizardPageShell";

export { SettingsPageShell } from "./SettingsPageShell";
export type { SettingsPageShellProps } from "./SettingsPageShell";

export { HubPageShell } from "./HubPageShell";
export type {
  HubGuide,
  HubNavItem,
  HubOrientation,
  HubPageShellAction,
  HubPageShellProps,
  HubReadinessItem,
  HubReadinessStatus,
  HubRelatedConfig,
} from "./HubPageShell";

export { BuilderPageShell } from "./BuilderPageShell";
export type {
  BuilderFooterAction,
  BuilderPageShellProps,
  BuilderSection,
  BuilderSectionStatus,
  BuilderStatusLabels,
} from "./BuilderPageShell";

export { WorkbenchPageShell } from "./WorkbenchPageShell";
export type {
  WorkbenchBucket,
  WorkbenchBucketTone,
  WorkbenchPageShellPagination,
  WorkbenchPageShellPrimaryAction,
  WorkbenchPageShellProps,
  WorkbenchPageShellRelatedConfig,
  WorkbenchPageShellToolbar,
} from "./WorkbenchPageShell";
