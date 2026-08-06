import {
  Building2,
  ClipboardList,
  Database,
  LayoutDashboard,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { platformCopy } from "../copy/platformCopy";

export interface PlatformNavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PLATFORM_NAV_ITEMS: PlatformNavItem[] = [
  {
    id: "dashboard",
    href: "/platform",
    label: platformCopy.nav.dashboard,
    icon: LayoutDashboard,
  },
  {
    id: "tenants",
    href: "/platform/tenants",
    label: platformCopy.nav.tenants,
    icon: Building2,
  },
  {
    id: "ar",
    href: "/platform/billing/ar",
    label: platformCopy.nav.ar,
    icon: Wallet,
  },
  {
    id: "catalogs",
    href: "/platform/catalogs",
    label: platformCopy.nav.catalogs,
    icon: Database,
  },
  {
    id: "audit",
    href: "/platform/audit",
    label: platformCopy.nav.audit,
    icon: ClipboardList,
  },
  {
    id: "security",
    href: "/platform/security",
    label: platformCopy.nav.security,
    icon: Shield,
  },
];

export function isPlatformNavItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === "/platform") {
    return pathname === "/platform";
  }
  return pathname.startsWith(href);
}
