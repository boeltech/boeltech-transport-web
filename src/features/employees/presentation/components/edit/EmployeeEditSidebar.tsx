import { cn } from "@shared/lib/utils/cn";
import type { LucideIcon } from "lucide-react";
import { employeesCopy } from "../../copy";

const sidebarCopy = employeesCopy.form.sidebar;

export interface EmployeeEditSectionItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface EmployeeEditSidebarProps {
  sections: EmployeeEditSectionItem[];
  activeSectionId: string;
  errorCountBySection: Record<string, number>;
  onSelectSection: (id: string) => void;
}

export function EmployeeEditSidebar({
  sections,
  activeSectionId,
  errorCountBySection,
  onSelectSection,
}: EmployeeEditSidebarProps) {
  return (
    <aside className="sticky top-24 z-20 rounded-xl border border-border/50 bg-muted/35 px-2 py-1.5 backdrop-blur-sm lg:top-28">
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
        {sidebarCopy.title}
      </p>
      <nav className="flex items-center gap-1 overflow-x-auto pb-0.5 lg:flex-col lg:items-stretch lg:overflow-visible">
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
                  title={sidebarCopy.errorsTitle(errors, section.label)}
                  aria-label={sidebarCopy.errorsAria(errors)}
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
