import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";

/**
 * Módulos disponibles en el sistema
 */
export type Module =
  | "dashboard"
  | "fleet"
  | "operations"
  | "clients"
  | "finance"
  | "hr"
  | "inventory"
  | "reports"
  | "admin";

/**
 * Configuración de acceso por rol a módulos
 */
const MODULE_ACCESS: Record<string, Module[]> = {
  admin: [
    "dashboard",
    "fleet",
    "operations",
    "clients",
    "finance",
    "hr",
    "inventory",
    "reports",
    "admin",
  ],
  gerente: ["dashboard", "fleet", "operations", "clients", "reports"],
  contador: ["dashboard", "finance", "hr", "reports"],
  operador: ["dashboard", "operations", "fleet"],
  cliente: ["dashboard"],
  user: ["dashboard"],
};

interface ModuleRouteProps {
  module: Module;
}

/**
 * ModuleRoute
 *
 * Guard que verifica si el usuario tiene acceso a un módulo específico.
 *
 * NOTA: Este componente SÍ puede usar useAuth() porque se renderiza
 * DENTRO de AppLayout, donde AuthProvider ya está disponible.
 */
export const ModuleRoute = ({ module }: ModuleRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin tiene acceso a todo
  if (user.role === "admin") {
    return <Outlet />;
  }

  // Verificar si el rol tiene acceso al módulo
  const allowedModules = MODULE_ACCESS[user.role] || [];
  const hasAccess = allowedModules.includes(module);

  if (!hasAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
