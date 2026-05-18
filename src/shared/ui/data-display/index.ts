/**
 * @shared/ui/data-display
 *
 * Bloques visuales reutilizables para mostrar datos en páginas de detalle.
 * Extraídos de los Detail pages para evitar duplicación.
 */

export { InfoRow } from "./InfoRow";
export type {
  InfoRowAlert,
  InfoRowProps,
  InfoRowVariant,
} from "./InfoRow";

export { StatCard } from "./StatCard";
export type { StatCardProps, StatCardTone } from "./StatCard";

export { DocumentRow } from "./DocumentRow";
export type { DocumentRowProps } from "./DocumentRow";

export { MetadataFooter } from "./MetadataFooter";
export type { MetadataFooterProps } from "./MetadataFooter";

export { DetailAlertCard } from "./DetailAlertCard";
export type {
  DetailAlertCardItem,
  DetailAlertCardProps,
  DetailAlertSeverity,
} from "./DetailAlertCard";

export { DetailTimeline } from "./DetailTimeline";
export type {
  DetailTimelineItem,
  DetailTimelineProps,
} from "./DetailTimeline";

export { DetailSection } from "./DetailSection";
export type { DetailSectionProps } from "./DetailSection";

export { SatFieldLabel } from "./SatFieldLabel";
export type { SatFieldLabelProps } from "./SatFieldLabel";
