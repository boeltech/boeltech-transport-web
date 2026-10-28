import {
  Activity,
  Building2,
  ClipboardList,
  Database,
  LayoutDashboard,
  Package,
  Palette,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { opsCopy } from "./opsCopy";

export interface OpsNavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Nav v1 PRD-D2 (sin Soporte). Catálogo = planes comerciales; SAT en secundaria. */
export const OPS_NAV_ITEMS: OpsNavItem[] = [
  {
    id: "hoy",
    href: "/platform",
    label: opsCopy.nav.hoy,
    icon: LayoutDashboard,
  },
  {
    id: "empresas",
    href: "/platform/tenants",
    label: opsCopy.nav.empresas,
    icon: Building2,
  },
  {
    id: "cobranza",
    href: "/platform/billing/ar",
    label: opsCopy.nav.cobranza,
    icon: Wallet,
  },
  {
    id: "catalogo",
    href: "/platform/plans",
    label: opsCopy.nav.catalogo,
    icon: Package,
  },
  {
    id: "uso",
    href: "/platform/usage",
    label: opsCopy.nav.uso,
    icon: Activity,
  },
  {
    id: "auditoria",
    href: "/platform/audit",
    label: opsCopy.nav.auditoria,
    icon: ClipboardList,
  },
];

export const OPS_SECONDARY_NAV: OpsNavItem[] = [
  {
    id: "catalogos-sat",
    href: "/platform/catalogs",
    label: "Catálogos SAT",
    icon: Database,
  },
  {
    id: "seguridad",
    href: "/platform/security",
    label: opsCopy.nav.seguridad,
    icon: Shield,
  },
];

/** Terciario owner-only (FOUND-D8) — antes de «Ir al ERP» / logout. */
export const OPS_TERTIARY_NAV: OpsNavItem[] = [
  {
    id: "design-system",
    href: "/platform/design-system",
    label: opsCopy.nav.designSystem,
    icon: Palette,
  },
];

export function isOpsNavItemActive(pathname: string, href: string): boolean {
  if (href === "/platform") {
    return pathname === "/platform";
  }
  return pathname.startsWith(href);
}
