/**
 * LongFormSectionNav + LongFormEditLayout
 *
 * Rail de secciones para formularios largos (edit en FormPageShell).
 * Extraído del patrón EmployeeEditSidebar; primera instancia flota: vehicles edit.
 *
 * Doc: `.agents/skills/design-system/SKILL.md` § Formularios largos.
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

export interface LongFormSectionItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface LongFormSectionNavProps {
  sections: LongFormSectionItem[];
  activeSectionId: string;
  errorCountBySection: Record<string, number>;
  onSelectSection: (id: string) => void;
  /** Título del rail. Default: «Secciones». */
  title?: string;
  errorsTitle?: (count: number, label: string) => string;
  errorsAria?: (count: number) => string;
  className?: string;
}

const DEFAULT_TITLE = "Secciones";

function defaultErrorsTitle(count: number, label: string): string {
  return `${count} error${count === 1 ? "" : "es"} en ${label}`;
}

function defaultErrorsAria(count: number): string {
  return `${count} errores`;
}

export function LongFormSectionNav({
  sections,
  activeSectionId,
  errorCountBySection,
  onSelectSection,
  title = DEFAULT_TITLE,
  errorsTitle = defaultErrorsTitle,
  errorsAria = defaultErrorsAria,
  className,
}: LongFormSectionNavProps) {
  return (
    <aside
      className={cn(
        "sticky top-24 z-20 rounded-xl border border-border/50 bg-muted/35 px-2 py-1.5 backdrop-blur-sm lg:top-28",
        className,
      )}
    >
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
        {title}
      </p>
      <nav
        aria-label={title}
        className="flex items-center gap-1 overflow-x-auto pb-0.5 lg:flex-col lg:items-stretch lg:overflow-visible"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSectionId === section.id;
          const errors = errorCountBySection[section.id] ?? 0;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={cn(
                "group relative inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all lg:w-full",
                isActive
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "border-transparent text-muted-foreground hover:border-border/40 hover:bg-background/70 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                {section.label}
              </span>
              {errors > 0 ? (
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full bg-destructive"
                  title={errorsTitle(errors, section.label)}
                  aria-label={errorsAria(errors)}
                />
              ) : isActive ? (
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full bg-success"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export interface LongFormEditLayoutProps {
  nav: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Grid rail + canvas para edición long-form. */
export function LongFormEditLayout({
  nav,
  children,
  className,
  contentClassName,
}: LongFormEditLayoutProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]",
        className,
      )}
    >
      {nav}
      <div className={cn("min-w-0 space-y-6", contentClassName)}>{children}</div>
    </div>
  );
}
