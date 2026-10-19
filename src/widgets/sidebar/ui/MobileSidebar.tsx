/**
 * MobileSidebar Component
 *
 * Drawer de navegación móvil (Sheet modal = focus trap + unmount al cerrar).
 * Logout / perfil viven en el Header (user menu).
 *
 * Ubicación: src/widgets/sidebar/ui/MobileSidebar.tsx
 */

import { memo, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@/shared/ui/button";
import { BrandLockup, BRAND } from "@/shared/ui/brand";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/shared/ui/sheet";

import { useSidebar } from "@/app/providers/SidebarProvider";
import { useNavigationWithBadges } from "../model/useNavigationWithBadges";
import type { NavItem } from "../model/types";
import { NavActiveRail } from "./NavActiveRail";
import { NavBadge } from "./NavBadge";
import {
  navGroupLabelClassName,
  navItemClassName,
  sidebarChromeButtonClassName,
  sidebarFocusRingClassName,
} from "./navItemStyles";

// ============================================
// MAIN COMPONENT
// ============================================

export const MobileSidebar = memo(function MobileSidebar() {
  const { isMobileOpen, closeMobile } = useSidebar();
  const { navigation, isItemActive } = useNavigationWithBadges();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeMobile();
    },
    [closeMobile],
  );

  const handleNavClick = useCallback(() => {
    closeMobile();
  }, [closeMobile]);

  // Foco inicial en el botón cerrar al abrir (Radix también atrapa foco).
  useEffect(() => {
    if (!isMobileOpen) return;
    const id = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [isMobileOpen]);

  return (
    <Sheet modal open={isMobileOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="flex w-72 max-w-[85vw] flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground border-sidebar-border sm:max-w-xs [&>button.absolute]:hidden"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center overflow-hidden rounded-md text-sidebar-foreground",
              sidebarFocusRingClassName,
            )}
            onClick={handleNavClick}
            aria-label={`Ir al dashboard de ${BRAND.productName}`}
          >
            <BrandLockup
              variant="onInk"
              markVariant="brand"
              decorative
              markSize={30}
            />
          </Link>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className={sidebarChromeButtonClassName()}
            onClick={closeMobile}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="p-3" aria-label="Navegación principal">
            {navigation.map((group) => (
              <div key={group.id} className="mb-3">
                {group.title && (
                  <h3 className={navGroupLabelClassName()}>{group.title}</h3>
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
      </SheetContent>
    </Sheet>
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
      aria-current={isActive ? "page" : undefined}
      className={navItemClassName({
        isActive,
        disabled: item.disabled,
      })}
    >
      <NavActiveRail visible={isActive} />
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && <NavBadge value={item.badge} />}
    </Link>
  );
});
