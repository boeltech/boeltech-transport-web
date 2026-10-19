/**
 * Header Component
 *
 * Barra superior con:
 * - Botón de menú móvil
 * - Buscador global / lupa móvil → GlobalCommandMenu (ancla izquierda, densidad F2)
 * - Cluster derecha: ayuda → inbox → tema | usuario
 * - Solid bg-background (sin glass/blur)
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
import { usePermissions } from "@shared/permissions";
import { useSidebar } from "@/app/providers/SidebarProvider";
import { getUserFullName, getUserInitials } from "@/shared/lib/userHelpers";
import {
  SIDEBAR_HEADER_LEFT_CLASS,
  SIDEBAR_HEADER_LEFT_COLLAPSED_CLASS,
  SIDEBAR_LAYOUT_TRANSITION_CLASS,
} from "@widgets/sidebar";
import { headerCopy } from "../copy/headerCopy";
import { GlobalCommandMenu } from "./GlobalCommandMenu";
import { NotificationInboxButton } from "@features/notifications";
import { HelpPanelButton } from "@features/help-center";

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
        "fixed top-0 right-0 z-30 flex h-14 items-center justify-between border-b border-border",
        "bg-background",
        "px-4 left-0",
        SIDEBAR_LAYOUT_TRANSITION_CLASS,
        SIDEBAR_HEADER_LEFT_CLASS,
        isCollapsed && SIDEBAR_HEADER_LEFT_COLLAPSED_CLASS,
        className,
      )}
    >
      {/* ==========================================
          Lado izquierdo — search como ancla
          ========================================== */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Botón de menú (móvil) */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 lg:hidden"
          onClick={openMobile}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>

        {/* Lupa móvil → mismo command menu */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 md:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label={headerCopy.commandMenu.title}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Navegación rápida (misma data filtrada que el sidebar) */}
        <div className="hidden md:flex" data-header-search>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              /* F2: más compacto que w-72/h-9 — ancla Linear/Asana sin perder ⌘K */
              "relative h-8 w-56 justify-start rounded-md text-muted-foreground lg:w-64",
              /* Operate cool: muted + hairline; sin warm wash de --accent */
              "border border-border bg-muted pl-9 pr-12 font-normal shadow-none",
              "hover:bg-muted hover:text-muted-foreground",
            )}
            onClick={() => setCommandOpen(true)}
            aria-label={headerCopy.commandMenu.title}
          >
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <span className="truncate text-sm">
              {headerCopy.commandMenu.trigger}
            </span>
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </Button>
        </div>

        <GlobalCommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      </div>

      {/* ==========================================
          Lado derecho — cluster denso (ayuda → inbox → tema | usuario)
          ========================================== */}
      <div
        className="flex items-center gap-0.5"
        data-header-actions
      >
        <HelpPanelButton />
        <NotificationInboxButton />
        <ThemeCycleButton />
        <div
          className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block"
          aria-hidden
          data-header-actions-divider
        />
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

const menuCopy = headerCopy.menu;

const UserMenu = memo(function UserMenu({ user, onLogout }: UserMenuProps) {
  const { hasPermission } = usePermissions();
  /** Sin el módulo settings, /settings responde con /forbidden. */
  const canOpenSettings = hasPermission("settings", "read");

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 items-center gap-1.5 px-1.5"
            data-header-user-menu
          >
            {/* Avatar */}
            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {getUserInitials(user)}
            </div>
            {/* Info (solo desktop amplio) */}
            <div className="hidden flex-col items-start text-left leading-tight lg:flex">
              <span className="text-sm font-medium">{getUserFullName(user)}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {user?.role || menuCopy.userFallback}
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
            {user?.tenant?.name || menuCopy.noCompany}
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {/* Opciones de navegación */}
          <DropdownMenuItem asChild>
            <Link to="/account">
              <User className="mr-2 h-4 w-4" />
              {menuCopy.account}
            </Link>
          </DropdownMenuItem>
          {canOpenSettings ? (
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                {menuCopy.settings}
              </Link>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {menuCopy.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
});
