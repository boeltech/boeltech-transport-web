import { Link } from "react-router-dom";
import {
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Building2,
} from "lucide-react";

import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";

import { useAuth } from "@app/providers/AuthProvider";
import { useTheme } from "@app/providers/ThemeProvider";
import { useSidebar } from "@app/providers/SidebarProvider";
import { getUserFullName, getUserInitials } from "@features/auth/model/types";

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * Header
 *
 * Barra superior con:
 * - Botón de menú móvil
 * - Buscador global (placeholder)
 * - Notificaciones
 * - Theme toggle
 * - Menú de usuario
 */
export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { collapsed } = useSidebar();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 transition-all duration-300 ease-in-out",
        // Ancho dinámico basado en el sidebar
        "left-0 lg:left-64",
        collapsed && "lg:left-16"
      )}
    >
      {/* ==========================================
          Lado izquierdo
          ========================================== */}
      <div className="flex items-center gap-4">
        {/* Botón de menú (móvil) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>

        {/* Buscador global */}
        <div className="hidden md:flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className={cn(
                "h-9 w-64 rounded-md border bg-background pl-10 pr-4 text-sm",
                "outline-none placeholder:text-muted-foreground",
                "focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* ==========================================
          Lado derecho
          ========================================== */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
          {/* Badge de notificaciones */}
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </Button>

        {/* Toggle de tema */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Cambiar tema</span>
        </Button>

        {/* Menú de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {getUserInitials(user)}
              </div>
              {/* Info (solo desktop) */}
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium">
                  {getUserFullName(user)}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.role || "Usuario"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Info del usuario */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{getUserFullName(user)}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Empresa */}
            <DropdownMenuItem disabled className="text-muted-foreground">
              <Building2 className="mr-2 h-4 w-4" />
              {user?.tenant?.name || "Sin empresa"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Opciones */}
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Ayuda
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
