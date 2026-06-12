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

import { memo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Building2,
} from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ThemeCycleButton } from "@/shared/ui/theme";

import { useAuth } from "@/shared/hooks/useAuth";
import { useSidebar } from "@/app/providers/SidebarProvider";
import { getUserFullName, getUserInitials } from "@/shared/lib/userHelpers";
import { GlobalCommandMenu } from "./GlobalCommandMenu";
import { NotificationInboxButton } from "@features/notifications";

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
  const { isCollapsed, openMobile } = useSidebar();
  const [commandOpen, setCommandOpen] = useState(false);

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

        {/* Navegación rápida (misma data filtrada que el sidebar) */}
        <div className="hidden md:flex">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "relative h-9 w-64 justify-start text-muted-foreground",
              "border bg-background pl-10 pr-12 font-normal shadow-none hover:bg-background",
            )}
            onClick={() => setCommandOpen(true)}
            aria-label="Abrir navegación rápida"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <span className="truncate text-sm">Ir a página…</span>
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </Button>
        </div>

        <GlobalCommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      </div>

      {/* ==========================================
          Lado derecho
          ========================================== */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <NotificationInboxButton />

        {/* Ciclo de tema: system → light → dark */}
        <ThemeCycleButton />

        {/* Menú de usuario */}
        <UserMenu user={user} onLogout={logout} />
      </div>
    </header>
  );
});

// ============================================
// User Menu
// ============================================

interface UserMenuProps {
  user: UserWithTenant | null | undefined;
  onLogout: () => void;
}

const UserMenu = memo(function UserMenu({ user, onLogout }: UserMenuProps) {
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
            Mi cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
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
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

