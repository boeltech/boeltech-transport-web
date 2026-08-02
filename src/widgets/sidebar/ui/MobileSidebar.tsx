/**
 * MobileSidebar Component
 *
 * Menú lateral para dispositivos móviles.
 * Se muestra como drawer con overlay.
 * Logout / perfil viven en el Header (user menu).
 *
 * Ubicación: src/widgets/sidebar/ui/MobileSidebar.tsx
 */

import { memo, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@/shared/ui/button";
import { BrandLockup } from "@/shared/ui/brand";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { useSidebar } from "@/app/providers/SidebarProvider";
import { useNavigationWithBadges } from "../model/useNavigationWithBadges";
import type { NavItem } from "../model/types";

// ============================================
// MAIN COMPONENT
// ============================================

export const MobileSidebar = memo(function MobileSidebar() {
  const { isMobileOpen, closeMobile } = useSidebar();
  const { navigation, isItemActive } = useNavigationWithBadges();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        closeMobile();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, closeMobile]);

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

  const handleNavClick = () => {
    closeMobile();
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            to="/dashboard"
            className="flex items-center overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            onClick={handleNavClick}
            aria-label="Ir al dashboard de Tlama"
          >
            <BrandLockup
              variant="brand"
              decorative
              markSize={28}
              wordmarkClassName="text-xl"
            />
          </Link>
          <Button variant="ghost" size="icon" onClick={closeMobile}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="p-3">
            {navigation.map((group) => (
              <div key={group.id} className="mb-5">
                {group.title && (
                  <h3 className="mb-2.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-0.5">
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
        </ScrollArea>
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
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive &&
          "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
        item.disabled && "opacity-50 pointer-events-none",
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
        />
      )}
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
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
