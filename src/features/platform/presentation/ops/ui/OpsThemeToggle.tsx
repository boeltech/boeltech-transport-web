import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { opsCopy } from "../opsCopy";
import { useOpsTheme } from "../OpsThemeProvider";
import type { OpsThemeMode } from "../opsTheme";
import { OpsButton } from "./OpsButton";
import { OpsPortalThemeScope, useOpsPortalContainer } from "./opsPortal";

const THEME_OPTIONS: {
  value: OpsThemeMode;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "system", label: opsCopy.theme.system, icon: Monitor },
  { value: "light", label: opsCopy.theme.light, icon: Sun },
  { value: "dark", label: opsCopy.theme.dark, icon: Moon },
];

const MENU_WIDTH = 160;

function ThemeModeIcon({
  mode,
  className,
}: {
  mode: OpsThemeMode;
  className?: string;
}) {
  switch (mode) {
    case "light":
      return <Sun className={className} aria-hidden />;
    case "dark":
      return <Moon className={className} aria-hidden />;
    case "system":
    default:
      return <Monitor className={className} aria-hidden />;
  }
}

export interface OpsThemeToggleProps {
  className?: string;
}

/**
 * Selector de tema Ops (Sistema / Claro / Oscuro) — LID-D4.
 * Menú en `#ops-portal-root`. El elegido lleva tick de tinta.
 */
export function OpsThemeToggle({ className }: OpsThemeToggleProps) {
  const { mode, setMode } = useOpsTheme();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const container = useOpsPortalContainer();

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const wasOpenRef = useRef(false);
  const returnFocusRef = useRef(false);
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      if (returnFocusRef.current) {
        returnFocusRef.current = false;
        buttonRef.current?.focus();
      }
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    const index = Math.max(
      0,
      THEME_OPTIONS.findIndex((option) => option.value === mode),
    );
    itemRefs.current[index]?.focus();
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const focusAt = (index: number) => {
      const count = THEME_OPTIONS.length;
      const next = (index + count) % count;
      itemRefs.current[next]?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as Node | null;
      const inMenu = target ? (menuRef.current?.contains(target) ?? false) : false;
      const onTrigger = target != null && target === buttonRef.current;
      if (!inMenu && !onTrigger) return;

      if (event.key === "Escape") {
        event.preventDefault();
        returnFocusRef.current = true;
        setOpen(false);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const current = itemRefs.current.findIndex(
        (item) => item === document.activeElement,
      );
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const start = current >= 0 ? current : delta > 0 ? -1 : 0;
      focusAt(start + delta);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      aria-label={opsCopy.theme.menuLabel}
      className="ops-theme-menu ops-rounded ops-hairline ops-bg-elevated z-40 min-w-[10rem] py-1"
      style={{
        position: "fixed",
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        width: MENU_WIDTH,
        boxShadow: "var(--ops-shadow-overlay)",
      }}
      data-testid="ops-theme-menu"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }, index) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            className="ops-menu-item flex items-center gap-2"
            onClick={() => {
              setMode(value);
              setOpen(false);
            }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  ) : null;

  const portaled =
    menu == null
      ? null
      : container
        ? createPortal(menu, container)
        : createPortal(
            <OpsPortalThemeScope>{menu}</OpsPortalThemeScope>,
            document.body,
          );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <OpsButton
        ref={buttonRef}
        variant="ghost"
        size="sm"
        aria-label={opsCopy.theme.trigger}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="ops-theme-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        <ThemeModeIcon mode={mode} className="h-4 w-4" />
      </OpsButton>
      {portaled}
    </div>
  );
}
