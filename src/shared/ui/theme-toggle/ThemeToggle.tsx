// src/shared/ui/theme-toggle/ThemeToggle.tsx

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@app/providers/ThemeProvider";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import type { ThemeMode } from "@app/providers/theme/types";

// ============================================
// ThemeToggle - Botón simple (toggle light/dark)
// ============================================
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Cambiar a tema ${theme === "light" ? "oscuro" : "claro"}`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
};

// ============================================
// ThemeDropdown - Menú con opciones (light/dark/system)
// ============================================
export const ThemeDropdown = () => {
  const { mode, setMode } = useTheme();

  const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  const currentOption = options.find((opt) => opt.value === mode);
  const CurrentIcon = currentOption?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cambiar tema">
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {options.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setMode(value)}
            className={mode === value ? "bg-accent" : ""}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================
// ThemeSwitch - Switch con labels
// ============================================
interface ThemeSwitchProps {
  showLabel?: boolean;
}

export const ThemeSwitch = ({ showLabel = true }: ThemeSwitchProps) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {showLabel && <Sun className="h-4 w-4 text-muted-foreground" />}

      <button
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${isDark ? "bg-primary" : "bg-input"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-background shadow-lg ring-0 transition duration-200 ease-in-out
            ${isDark ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>

      {showLabel && <Moon className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
};

// ============================================
// Export index
// ============================================
// src/shared/ui/theme-toggle/index.ts
/*
export { ThemeToggle } from './ThemeToggle';
export { ThemeDropdown } from './ThemeToggle';
export { ThemeSwitch } from './ThemeToggle';
*/
