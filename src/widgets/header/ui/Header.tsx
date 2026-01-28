/**
 * Header Component
 *
 * Barra superior con:
 * - Botón de menú móvil
 * - Buscador global (placeholder)
 * - Notificaciones
 * - Theme toggle
 * - Menú de usuario
 *
 * Ubicación: src/widgets/header/ui/Header.tsx
 */

import { memo } from "react";
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
  Monitor,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/shared/ui/dropdown-menu";

import { useAuth } from "@/shared/hooks/useAuth";
import { useTheme } from "@/shared/hooks/useTheme";
import { useSidebar } from "@/app/providers/SidebarProvider";
import { getUserFullName, getUserInitials } from "@/shared/lib/userHelpers";

// ============================================
// Types
// ============================================

interface HeaderProps {
  /** Clase adicional */
  className?: string;
}

interface UserWithTenant {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string;
  tenant?: {
    name?: string;
  };
}

// ============================================
// Main Component
// ============================================

export const Header = memo(function Header({ className }: HeaderProps) {
  const { user, logout } = useAuth();
  const { mode, resolvedTheme, setMode, toggleTheme, isDark } = useTheme();
  const { isCollapsed, openMobile } = useSidebar();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 transition-all duration-300 ease-in-out",
        // Ancho dinámico basado en el sidebar
        "left-0 lg:left-[260px]",
        isCollapsed && "lg:left-[70px]",
        className,
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
          onClick={openMobile}
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
                "focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        <NotificationButton />

        {/* Toggle de tema (simple) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Cambiar tema</span>
        </Button>

        {/* Menú de usuario */}
        <UserMenu
          user={user}
          themeMode={mode}
          onThemeChange={setMode}
          onLogout={logout}
        />
      </div>
    </header>
  );
});

// ============================================
// Notification Button
// ============================================

const NotificationButton = memo(function NotificationButton() {
  // TODO: Integrar con sistema de notificaciones real
  const notificationCount = 3;

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      <span className="sr-only">Notificaciones</span>
      {notificationCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {notificationCount > 9 ? "9+" : notificationCount}
        </span>
      )}
    </Button>
  );
});

// ============================================
// User Menu
// ============================================

interface UserMenuProps {
  user: UserWithTenant | null | undefined;
  themeMode: "light" | "dark" | "system";
  onThemeChange: (mode: "light" | "dark" | "system") => void;
  onLogout: () => void;
}

const UserMenu = memo(function UserMenu({
  user,
  themeMode,
  onThemeChange,
  onLogout,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {getUserInitials(user)}
          </div>
          {/* Info (solo desktop) */}
          <div className="hidden flex-col items-start text-left md:flex">
            <span className="text-sm font-medium">{getUserFullName(user)}</span>
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

        {/* Opciones de navegación */}
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User className="mr-2 h-4 w-4" />
            Mi Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Link>
        </DropdownMenuItem>

        {/* Submenú de Tema */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {themeMode === "dark" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : themeMode === "light" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Monitor className="mr-2 h-4 w-4" />
            )}
            Tema
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={themeMode}
              onValueChange={(value) =>
                onThemeChange(value as "light" | "dark" | "system")
              }
            >
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                Claro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                Oscuro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 h-4 w-4" />
                Sistema
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          Ayuda
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
