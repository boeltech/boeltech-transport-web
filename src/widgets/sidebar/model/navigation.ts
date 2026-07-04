/**
 * Navigation Configuration
 *
 * Configuración completa de la navegación del sidebar.
 * Los módulos corresponden a los definidos en el sistema de permisos.
 *
 * Rutas API de referencia (roles explícitos en backend):
 * - GET /finance/summary, GET /finance/account-statement → admin, manager, accountant
 *   (`boeltech-transport-api` invoicing.routes.ts)
 * - Listado de facturas y prefill → también dispatcher (y client en invoices según API)
 *
 * Ubicación: src/widgets/sidebar/model/navigation.ts
 * Copy: shell.copy.navigation.* en ../copy/navigationCopy.ts
 */

import { ROLES } from "@shared/constants/roles";
import { FINANCE_SUMMARY_ROUTE_ROLES } from "@shared/permissions";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  FileText,
  UserCog,
  BarChart3,
  Settings,
  Wrench,
  Fuel,
  Building2,
  GitBranch,
  ScrollText,
  UsersRound,
  ClipboardCheck,
} from "lucide-react";
import { navigationCopy } from "../copy/navigationCopy";
import type { NavGroup } from "./types";

const copy = navigationCopy;

/**
 * Configuración completa de la navegación
 *
 * IMPORTANTE: Los valores de `module` deben coincidir con los
 * definidos en src/shared/auth/domain/entities.ts
 *
 * Módulos disponibles:
 * - dashboard, trips, vehicles, drivers, clients
 * - maintenance, fuel, invoices, reports, users, settings
 */
export const navigationConfig: NavGroup[] = [
  {
    id: "main",
    title: "",
    items: [
      {
        id: "dashboard",
        label: copy.item.dashboard,
        path: "/dashboard",
        icon: LayoutDashboard,
        module: "dashboard",
      },
    ],
  },
  {
    id: "operations",
    title: copy.group.operations,
    items: [
      {
        id: "trips",
        label: copy.item.trips,
        path: "/trips",
        icon: Route,
        module: "trips",
      },
      {
        id: "branches",
        label: copy.item.branches,
        path: "/branches",
        icon: GitBranch,
        module: "branches",
      },
    ],
  },
  {
    id: "fleet",
    title: copy.group.fleet,
    items: [
      {
        id: "vehicles",
        label: copy.item.vehicles,
        path: "/vehicles",
        icon: Truck,
        module: "vehicles",
      },
      {
        id: "drivers",
        label: copy.item.drivers,
        path: "/drivers",
        icon: Users,
        module: "drivers",
      },
      {
        id: "maintenance",
        label: copy.item.maintenance,
        path: "/maintenance",
        icon: Wrench,
        module: "maintenance",
        disabled: true,
        badge: copy.badge.comingSoon,
      },
      {
        id: "fuel",
        label: copy.item.fuel,
        path: "/fuel",
        icon: Fuel,
        module: "fuel",
        disabled: true,
        badge: copy.badge.comingSoon,
      },
    ],
  },
  {
    id: "clients",
    title: copy.group.clients,
    items: [
      {
        id: "clients-list",
        label: copy.item.clientsList,
        path: "/clients",
        icon: Building2,
        module: "clients",
      },
    ],
  },
  {
    id: "hr",
    title: copy.group.hr,
    items: [
      {
        id: "employees",
        label: copy.item.employees,
        path: "/employees",
        icon: UsersRound,
        module: "employees",
      },
    ],
  },
  {
    id: "finance",
    title: copy.group.finance,
    items: [
      {
        id: "finance-hub",
        label: copy.item.financeHub,
        path: "/finance",
        icon: FileText,
        roles: [...FINANCE_SUMMARY_ROUTE_ROLES],
      },
      {
        id: "finance-approvals",
        label: copy.item.financeApprovals,
        path: "/finance/approvals?status=pending&type=trip_expense",
        icon: ClipboardCheck,
        module: "finance_approvals",
      },
      {
        id: "finance-invoices",
        label: copy.item.financeInvoices,
        path: "/finance?tab=invoices",
        icon: FileText,
        roles: [ROLES.DISPATCHER, ROLES.CLIENT],
      },
    ],
  },
  {
    id: "reports",
    title: copy.group.reports,
    items: [
      {
        id: "reports-list",
        label: copy.item.reportsList,
        path: "/reports",
        icon: BarChart3,
        module: "reports",
        disabled: true,
        badge: copy.badge.comingSoon,
      },
    ],
  },
  {
    id: "admin",
    title: copy.group.admin,
    items: [
      {
        id: "users",
        label: copy.item.users,
        path: "/users",
        icon: UserCog,
        module: "users",
      },
      {
        id: "users-activity",
        label: copy.item.usersActivity,
        path: "/users/activity",
        icon: ScrollText,
        roles: [ROLES.ADMIN],
      },
      {
        id: "settings",
        label: copy.item.settings,
        path: "/settings",
        icon: Settings,
        module: "settings",
      },
    ],
  },
];

/** Rutas que no requieren autenticación */
export const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/** Ruta por defecto después del login */
export const defaultAuthenticatedRoute = "/dashboard";

/** Ruta de login */
export const loginRoute = "/login";
