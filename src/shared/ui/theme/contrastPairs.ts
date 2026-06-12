export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
  label?: string;
}

/** Pares foreground/background que deben cumplir WCAG AA (texto normal 4.5:1). */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: "foreground", bg: "background", min: 4.5, label: "Body text" },
  { fg: "card-foreground", bg: "card", min: 4.5, label: "Card" },
  { fg: "popover-foreground", bg: "popover", min: 4.5, label: "Popover" },
  { fg: "primary-foreground", bg: "primary", min: 4.5, label: "Primary button" },
  {
    fg: "secondary-foreground",
    bg: "secondary",
    min: 4.5,
    label: "Secondary",
  },
  { fg: "muted-foreground", bg: "muted", min: 4.5, label: "Muted" },
  { fg: "accent-foreground", bg: "accent", min: 4.5, label: "Accent" },
  { fg: "success-foreground", bg: "success", min: 4.5, label: "Success solid" },
  { fg: "warning-foreground", bg: "warning", min: 4.5, label: "Warning solid" },
  { fg: "info-foreground", bg: "info", min: 4.5, label: "Info solid" },
  {
    fg: "destructive-foreground",
    bg: "destructive",
    min: 4.5,
    label: "Destructive solid",
  },
  { fg: "neutral-foreground", bg: "neutral", min: 4.5, label: "Neutral solid" },
  {
    fg: "success-soft-foreground",
    bg: "success-soft",
    min: 4.5,
    label: "Success soft",
  },
  {
    fg: "warning-soft-foreground",
    bg: "warning-soft",
    min: 4.5,
    label: "Warning soft",
  },
  {
    fg: "info-soft-foreground",
    bg: "info-soft",
    min: 4.5,
    label: "Info soft",
  },
  {
    fg: "destructive-soft-foreground",
    bg: "destructive-soft",
    min: 4.5,
    label: "Destructive soft",
  },
  {
    fg: "neutral-soft-foreground",
    bg: "neutral-soft",
    min: 4.5,
    label: "Neutral soft",
  },
  {
    fg: "sidebar-foreground",
    bg: "sidebar",
    min: 4.5,
    label: "Sidebar",
  },
  {
    fg: "sidebar-primary-foreground",
    bg: "sidebar-primary",
    min: 4.5,
    label: "Sidebar primary",
  },
  {
    fg: "sidebar-accent-foreground",
    bg: "sidebar-accent",
    min: 4.5,
    label: "Sidebar accent",
  },
] as const;
