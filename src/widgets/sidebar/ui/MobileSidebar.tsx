/**
 * MobileSidebar Component
 *
 * Menú lateral para dispositivos móviles.
 * Se muestra como drawer con overlay.
 *
 * Ubicación: src/widgets/sidebar/ui/MobileSidebar.tsx
 */

import { memo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Truck, X, LogOut } from "lucide-react";

import { cn } from "@shared/lib/utils";
import { Button } from "@/shared/ui/button";

// import { useAuth } from '@/shared/hooks/useAuth';
import { useAuth } from "@features/auth";
import { useSidebar } from "@/app/providers/SidebarProvider";
import { useNavigation } from "../model/useNavigation";
import type { NavItem } from "../model/types";

// ============================================
// MAIN COMPONENT
// ============================================

export const MobileSidebar = memo(function MobileSidebar() {
  const { user, logout } = useAuth();
  const { isMobileOpen, closeMobile } = useSidebar();
  const { navigation, isItemActive } = useNavigation();

  // Cerrar al presionar Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        closeMobile();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, closeMobile]);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleLogout = () => {
    closeMobile();
    logout();
  };

  const handleNavClick = () => {
    closeMobile();
  };

  return (
    <>
      {/* ==========================================
          Overlay
          ========================================== */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* ==========================================
          Sidebar Drawer
          ========================================== */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 bg-card shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2"
            onClick={handleNavClick}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Boeltech</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={closeMobile}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </div>

        {/* User info */}
        {user && (
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {user.firstName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navigation.map((group) => (
            <div key={group.id} className="mb-6">
              {group.title && (
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    isActive={isItemActive(item)}
                    onClick={handleNavClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
});

// ============================================
// MOBILE NAV ITEM
// ============================================

interface MobileNavItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const MobileNavItem = memo(function MobileNavItem({
  item,
  isActive,
  onClick,
}: MobileNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive &&
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
        item.disabled && "opacity-50 pointer-events-none",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge !== 0 && item.badge !== "" && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
          {typeof item.badge === "number" && item.badge > 99
            ? "99+"
            : item.badge}
        </span>
      )}
    </Link>
  );
});
