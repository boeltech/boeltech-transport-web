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
  Container,
  Users,
  Route,
  FileText,
  FileClock,
  Wallet,
  UserCog,
  BarChart3,
  Settings,
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
 * Cinco grupos + Inicio suelto. Solo se listan pantallas montadas:
 * un ítem del menú nunca anuncia funcionalidad inexistente.
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
        id: "trailers",
        label: copy.item.trailers,
        path: "/trailers",
        icon: Container,
        module: "trailers",
      },
      {
        id: "drivers",
        label: copy.item.drivers,
        path: "/drivers",
        icon: Users,
        module: "drivers",
      },
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
    id: "commercial",
    title: copy.group.commercial,
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
        id: "finance-invoiceable",
        label: copy.item.financeInvoiceable,
        path: "/finance?tab=invoiceable",
        icon: FileClock,
        module: "invoices",
        action: "create",
      },
      {
        id: "finance-cobros",
        label: copy.item.financeCobros,
        path: "/finance?tab=cobros",
        icon: Wallet,
        module: "finance",
        action: "create",
      },
      {
        id: "finance-approvals",
        label: copy.item.financeApprovals,
        path: "/finance?tab=approvals",
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
      {
        id: "reports-list",
        label: copy.item.reportsList,
        path: "/reports",
        icon: BarChart3,
        module: "reports",
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

/**
 * Navegación plana del portal client (consulta: envíos + facturas).
 * Staff sigue usando `navigationConfig`.
 */
export const clientPortalNavigationConfig: NavGroup[] = [
  {
    id: "portal",
    title: "",
    items: [
      {
        id: "dashboard",
        label: copy.portal.dashboard,
        path: "/dashboard",
        icon: LayoutDashboard,
        module: "dashboard",
      },
      {
        id: "trips",
        label: copy.portal.trips,
        path: "/trips",
        icon: Route,
        module: "trips",
      },
      {
        id: "finance-invoices",
        label: copy.portal.invoices,
        path: "/finance?tab=invoices",
        icon: FileText,
        roles: [ROLES.CLIENT],
      },
    ],
  },
];

/**
 * Navegación plana del portal driver (operación: sus viajes + seguimiento).
 * Sin flota/reportes/finanzas. Staff y client usan otras configs.
 */
export const driverPortalNavigationConfig: NavGroup[] = [
  {
    id: "driver-portal",
    title: "",
    items: [
      {
        id: "dashboard",
        label: copy.driverPortal.dashboard,
        path: "/dashboard",
        icon: LayoutDashboard,
        module: "dashboard",
      },
      {
        id: "trips",
        label: copy.driverPortal.trips,
        path: "/trips",
        icon: Route,
        module: "trips",
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
