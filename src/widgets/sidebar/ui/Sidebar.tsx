import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Truck } from "lucide-react";
import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/button";
import { useNavigation } from "../model/useNavigation";
import { useSidebar } from "@widgets/layout";
import type { NavGroup, NavItem } from "../model/types";

// ============================================
// Sidebar Principal
// ============================================
export const Sidebar = () => {
  const { navigation } = useNavigation();
  const { isCollapsed, isMobileOpen, isMobile, toggleCollapsed, closeMobile } =
    useSidebar();

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300",
          // Desktop
          "lg:relative lg:z-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile
          "w-64",
          isMobile && !isMobileOpen && "-translate-x-full",
          isMobile && isMobileOpen && "translate-x-0"
        )}
      >
        {/* Header del Sidebar */}
        <SidebarHeader
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onClose={closeMobile}
        />

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navigation.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              isCollapsed={isCollapsed && !isMobile}
              onItemClick={isMobile ? closeMobile : undefined}
            />
          ))}
        </nav>

        {/* Footer del Sidebar (botón colapsar) */}
        {!isMobile && (
          <SidebarFooter isCollapsed={isCollapsed} onToggle={toggleCollapsed} />
        )}
      </aside>
    </>
  );
};

// ============================================
// Header del Sidebar
// ============================================
interface SidebarHeaderProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const SidebarHeader = ({
  isCollapsed,
  isMobile,
  onClose,
}: SidebarHeaderProps) => {
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b px-4",
        isCollapsed && !isMobile ? "justify-center" : "justify-between"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Truck className="h-5 w-5 text-primary-foreground" />
        </div>
        {(!isCollapsed || isMobile) && (
          <span className="text-lg font-semibold">ERP Transporte</span>
        )}
      </div>

      {/* Botón cerrar (solo móvil) */}
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

// ============================================
// Grupo de Navegación
// ============================================
interface SidebarGroupProps {
  group: NavGroup;
  isCollapsed: boolean;
  onItemClick?: () => void;
}

const SidebarGroup = ({
  group,
  isCollapsed,
  onItemClick,
}: SidebarGroupProps) => {
  return (
    <div className="mb-4">
      {/* Título del grupo (oculto si está colapsado) */}
      {group.title && !isCollapsed && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.title}
        </h3>
      )}

      {/* Items */}
      <ul className="space-y-1">
        {group.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onClick={onItemClick}
          />
        ))}
      </ul>
    </div>
  );
};

// ============================================
// Item de Navegación
// ============================================
interface SidebarItemProps {
  item: NavItem;
  isCollapsed: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ item, isCollapsed, onClick }: SidebarItemProps) => {
  const location = useLocation();
  const Icon = item.icon;

  // Determinar si está activo (ruta actual o subruta)
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(`${item.path}/`);

  return (
    <li>
      <NavLink
        to={item.path}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground",
          isCollapsed && "justify-center px-2"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />

        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>

            {/* Badge opcional */}
            {item.badge && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                  "bg-primary text-primary-foreground"
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
};

// ============================================
// Footer del Sidebar
// ============================================
interface SidebarFooterProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const SidebarFooter = ({ isCollapsed, onToggle }: SidebarFooterProps) => {
  return (
    <div className="border-t p-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn("w-full", isCollapsed ? "px-2" : "justify-start")}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-2">Colapsar</span>
          </>
        )}
      </Button>
    </div>
  );
};
