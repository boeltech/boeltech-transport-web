import {
  LayoutDashboard,
  Truck,
  Route,
  Users,
  Building2,
  FileText,
  DollarSign,
  Fuel,
  Wrench,
  BarChart3,
  Settings,
  Shield,
  UserCog,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

/**
 * Elemento de navegación
 */
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Permiso requerido para ver este item */
  permission?: string;
  /** Roles que pueden ver este item (si no hay permission) */
  roles?: string[];
  /** Badge para notificaciones */
  badge?: number;
}

/**
 * Grupo de navegación
 */
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/**
 * Configuración de navegación principal
 */
export const navigationConfig: NavGroup[] = [
  {
    id: "main",
    label: "Principal",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        // Dashboard disponible para todos los autenticados
      },
    ],
  },
  {
    id: "operations",
    label: "Operaciones",
    items: [
      {
        id: "trips",
        label: "Viajes",
        icon: Route,
        href: "/operations/trips",
        permission: "operations:trips:read",
      },
      {
        id: "tracking",
        label: "Seguimiento",
        icon: Truck,
        href: "/operations/tracking",
        permission: "operations:tracking:read",
      },
    ],
  },
  {
    id: "fleet",
    label: "Flota",
    items: [
      {
        id: "vehicles",
        label: "Vehículos",
        icon: Truck,
        href: "/fleet/vehicles",
        permission: "fleet:vehicles:read",
      },
      {
        id: "drivers",
        label: "Conductores",
        icon: Users,
        href: "/fleet/drivers",
        permission: "fleet:drivers:read",
      },
      {
        id: "maintenance",
        label: "Mantenimiento",
        icon: Wrench,
        href: "/fleet/maintenance",
        permission: "fleet:maintenance:read",
      },
      {
        id: "fuel",
        label: "Combustible",
        icon: Fuel,
        href: "/fleet/fuel",
        permission: "fleet:fuel:read",
      },
    ],
  },
  {
    id: "clients",
    label: "Comercial",
    items: [
      {
        id: "clients",
        label: "Clientes",
        icon: Building2,
        href: "/clients",
        permission: "clients:read",
      },
      {
        id: "quotes",
        label: "Cotizaciones",
        icon: FileText,
        href: "/quotes",
        permission: "quotes:read",
      },
    ],
  },
  {
    id: "finance",
    label: "Finanzas",
    items: [
      {
        id: "invoices",
        label: "Facturación",
        icon: FileText,
        href: "/finance/invoices",
        permission: "finance:invoices:read",
      },
      {
        id: "expenses",
        label: "Gastos",
        icon: DollarSign,
        href: "/finance/expenses",
        permission: "finance:expenses:read",
      },
      {
        id: "payments",
        label: "Pagos",
        icon: DollarSign,
        href: "/finance/payments",
        permission: "finance:payments:read",
      },
    ],
  },
  {
    id: "hr",
    label: "Recursos Humanos",
    items: [
      {
        id: "employees",
        label: "Empleados",
        icon: Users,
        href: "/hr/employees",
        permission: "hr:employees:read",
      },
      {
        id: "payroll",
        label: "Nómina",
        icon: DollarSign,
        href: "/hr/payroll",
        permission: "hr:payroll:read",
      },
    ],
  },
  {
    id: "reports",
    label: "Reportes",
    items: [
      {
        id: "reports",
        label: "Reportes",
        icon: BarChart3,
        href: "/reports",
        permission: "reports:read",
      },
    ],
  },
  {
    id: "admin",
    label: "Administración",
    items: [
      {
        id: "users",
        label: "Usuarios",
        icon: UserCog,
        href: "/admin/users",
        roles: ["admin"],
      },
      {
        id: "roles",
        label: "Roles y Permisos",
        icon: Shield,
        href: "/admin/roles",
        roles: ["admin"],
      },
      {
        id: "audit",
        label: "Auditoría",
        icon: ScrollText,
        href: "/admin/audit",
        roles: ["admin"],
      },
      {
        id: "settings",
        label: "Configuración",
        icon: Settings,
        href: "/admin/settings",
        roles: ["admin", "gerente"],
      },
    ],
  },
];

/**
 * Filtra la navegación según los permisos del usuario
 */
export const filterNavigation = (
  navigation: NavGroup[],
  userRole: string,
  hasPermission: (permission: string) => boolean
): NavGroup[] => {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // Admin ve todo
        if (userRole === "admin") return true;

        // Si tiene permiso específico
        if (item.permission) {
          return hasPermission(item.permission);
        }

        // Si tiene roles específicos
        if (item.roles && item.roles.length > 0) {
          return item.roles.includes(userRole);
        }

        // Sin restricciones, visible para todos
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0); // Quitar grupos vacíos
};
