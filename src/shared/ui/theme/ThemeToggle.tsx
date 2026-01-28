/**
 * Theme Toggle Components
 *
 * Componentes UI para cambiar el tema de la aplicación.
 *
 * Ubicación: src/shared/ui/theme/ThemeToggle.tsx
 *
 * @example
 * // Botón simple (alterna light/dark)
 * <ThemeToggle />
 *
 * // Dropdown con opciones (light/dark/system)
 * <ThemeDropdown />
 *
 * // Switch con labels
 * <ThemeSwitch showLabel />
 */

import { memo } from "react";
import { Moon, Sun, Monitor, type LucideIcon } from "lucide-react";
import { useTheme } from "@/shared/hooks/useTheme";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@shared/lib/utils";
import type { ThemeMode } from "./types";

// ============================================
// ThemeToggle - Botón simple (toggle light/dark)
// ============================================

interface ThemeToggleProps {
  /** Tamaño del botón */
  size?: "sm" | "default" | "lg" | "icon";
  /** Variante del botón */
  variant?: "ghost" | "outline" | "default";
  /** Clases adicionales */
  className?: string;
}

export const ThemeToggle = memo(function ThemeToggle({
  size = "icon",
  variant = "ghost",
  className,
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={className}
      aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
    >
      {isDark ? (
        <Sun className="h-5 w-5 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
});

// ============================================
// ThemeDropdown - Menú con opciones
// ============================================

interface ThemeModeOption {
  value: ThemeMode;
  label: string;
  icon: LucideIcon;
}

const THEME_OPTIONS: ThemeModeOption[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

interface ThemeDropdownProps {
  /** Alineación del menú */
  align?: "start" | "center" | "end";
  /** Clases adicionales */
  className?: string;
}

export const ThemeDropdown = memo(function ThemeDropdown({
  align = "end",
  className,
}: ThemeDropdownProps) {
  const { mode, setMode } = useTheme();

  const currentOption = THEME_OPTIONS.find((opt) => opt.value === mode);
  const CurrentIcon = currentOption?.icon ?? Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Cambiar tema"
        >
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align}>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setMode(value)}
            className={cn("cursor-pointer", mode === value && "bg-accent")}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// ============================================
// ThemeSwitch - Switch con labels
// ============================================

interface ThemeSwitchProps {
  /** Mostrar iconos de sol/luna */
  showIcons?: boolean;
  /** Tamaño del switch */
  size?: "sm" | "default";
  /** Clases adicionales */
  className?: string;
}

export const ThemeSwitch = memo(function ThemeSwitch({
  showIcons = true,
  size = "default",
  className,
}: ThemeSwitchProps) {
  const { isDark, toggleTheme } = useTheme();

  const sizes = {
    sm: {
      track: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: "translate-x-4",
      icon: "h-3 w-3",
    },
    default: {
      track: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
      icon: "h-4 w-4",
    },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcons && (
        <Sun
          className={cn(
            s.icon,
            "text-muted-foreground",
            !isDark && "text-amber-500",
          )}
        />
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full",
          "border-2 border-transparent transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDark ? "bg-primary" : "bg-input",
          s.track,
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block transform rounded-full",
            "bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
            isDark ? s.translate : "translate-x-0",
            s.thumb,
          )}
        />
      </button>

      {showIcons && (
        <Moon
          className={cn(
            s.icon,
            "text-muted-foreground",
            isDark && "text-blue-400",
          )}
        />
      )}
    </div>
  );
});

// ============================================
// ThemeSegmented - Botones segmentados
// ============================================

interface ThemeSegmentedProps {
  /** Clases adicionales */
  className?: string;
}

export const ThemeSegmented = memo(function ThemeSegmented({
  className,
}: ThemeSegmentedProps) {
  const { mode, setMode } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted p-1",
        className,
      )}
      role="radiogroup"
      aria-label="Seleccionar tema"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          onClick={() => setMode(value)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5",
            "text-sm font-medium transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            mode === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
});
