/**
 * @shared/ui/page-shells
 *
 * Esqueletos estándar para las páginas del ERP.
 * Cada shell estandariza el patrón visual de un tipo de pantalla,
 * eliminando duplicación entre features.
 *
 * - ListPageShell      → listas con filtros + paginación
 * - DetailPageShell    → detalle con header + alerts + stats + tabs + metadata
 * - FormPageShell      → edición simple (no wizard)
 * - WizardPageShell    → creación por pasos
 * - SettingsPageShell  → wrapper sobre SettingsLayout
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
} from "./WizardPageShell";

export { SettingsPageShell } from "./SettingsPageShell";
export type { SettingsPageShellProps } from "./SettingsPageShell";
