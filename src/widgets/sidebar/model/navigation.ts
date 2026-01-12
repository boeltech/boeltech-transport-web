import {
  LayoutDashboard,
  Truck,
  Users as UsersIcon,
  Route,
  DollarSign,
  FileText,
  Receipt,
  CreditCard,
  UserCog,
  ClipboardList,
  Package,
  BarChart3,
  Settings,
  Shield,
  History,
  Wrench,
  Fuel,
} from "lucide-react";
import { NavGroup } from "./types";

/**
 * Configuración completa de la navegación
 * Organizada por grupos según los módulos del ERP
 */
export const navigationConfig: NavGroup[] = [
  // ============================================
  // Dashboard (sin grupo, item suelto)
  // ============================================
  {
    id: "main",
    title: "",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  // ============================================
  // Flota
  // ============================================
  {
    id: "fleet",
    title: "Flota",
    module: "fleet",
    items: [
      {
        id: "vehicles",
        label: "Vehículos",
        path: "/fleet/vehicles",
        icon: Truck,
        module: "fleet",
      },
      {
        id: "drivers",
        label: "Conductores",
        path: "/fleet/drivers",
        icon: UsersIcon,
        module: "fleet",
      },
      {
        id: "maintenance",
        label: "Mantenimiento",
        path: "/fleet/maintenance",
        icon: Wrench,
        module: "fleet",
      },
      {
        id: "fuel",
        label: "Combustible",
        path: "/fleet/fuel",
        icon: Fuel,
        module: "fleet",
      },
    ],
  },

  // ============================================
  // Operaciones
  // ============================================
  {
    id: "operations",
    title: "Operaciones",
    module: "operations",
    items: [
      {
        id: "trips",
        label: "Viajes",
        path: "/operations/trips",
        icon: Route,
        module: "operations",
      },
    ],
  },

  // ============================================
  // Clientes
  // ============================================
  {
    id: "clients",
    title: "Clientes",
    module: "clients",
    items: [
      {
        id: "clients-list",
        label: "Clientes",
        path: "/clients",
        icon: UsersIcon,
        module: "clients",
      },
    ],
  },

  // ============================================
  // Finanzas
  // ============================================
  {
    id: "finance",
    title: "Finanzas",
    module: "finance",
    items: [
      {
        id: "invoices",
        label: "Facturación",
        path: "/finance/invoices",
        icon: FileText,
        module: "finance",
      },
      {
        id: "expenses",
        label: "Gastos",
        path: "/finance/expenses",
        icon: Receipt,
        module: "finance",
      },
      {
        id: "payments",
        label: "Pagos",
        path: "/finance/payments",
        icon: CreditCard,
        module: "finance",
      },
    ],
  },

  // ============================================
  // Recursos Humanos
  // ============================================
  {
    id: "hr",
    title: "Recursos Humanos",
    module: "hr",
    items: [
      {
        id: "employees",
        label: "Empleados",
        path: "/hr/employees",
        icon: UserCog,
        module: "hr",
      },
      {
        id: "payroll",
        label: "Nómina",
        path: "/hr/payroll",
        icon: ClipboardList,
        module: "hr",
      },
    ],
  },

  // ============================================
  // Inventario
  // ============================================
  {
    id: "inventory",
    title: "Inventario",
    module: "inventory",
    items: [
      {
        id: "parts",
        label: "Refacciones",
        path: "/inventory/parts",
        icon: Package,
        module: "inventory",
      },
    ],
  },

  // ============================================
  // Reportes
  // ============================================
  {
    id: "reports",
    title: "Reportes",
    module: "reports",
    items: [
      {
        id: "reports-list",
        label: "Reportes",
        path: "/reports",
        icon: BarChart3,
        module: "reports",
      },
    ],
  },

  // ============================================
  // Administración
  // ============================================
  {
    id: "admin",
    title: "Administración",
    module: "admin",
    items: [
      {
        id: "users",
        label: "Usuarios",
        path: "/admin/users",
        icon: UsersIcon,
        module: "admin",
      },
      {
        id: "roles",
        label: "Roles y Permisos",
        path: "/admin/roles",
        icon: Shield,
        module: "admin",
      },
      {
        id: "audit",
        label: "Auditoría",
        path: "/admin/audit",
        icon: History,
        module: "admin",
      },
      {
        id: "settings",
        label: "Configuración",
        path: "/admin/settings",
        icon: Settings,
        module: "admin",
      },
    ],
  },
];
