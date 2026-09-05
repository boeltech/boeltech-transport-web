/**
 * BuilderPageShell — ADR-0091
 *
 * Shell para construcción de objetos de dominio complejos.
 * Navegación no lineal · Canvas · Inspector · Footer actions.
 * Cero dominio de feature — slots genéricos.
 *
 * Anatomía (orden fijo):
 *   Header → banner? → (Section Nav | Canvas | Inspector) → Footer
 *
 * Desktop (≥1024): 3 columnas. Mobile: tabs horizontales + inspector en Sheet.
 * Canvas sin card chrome (las FormSectionCard de feature aportan la superficie).
 */

import {
  memo,
  useCallback,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, PanelRight, PanelRightClose } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export type BuilderSectionStatus = "complete" | "partial" | "empty";

export interface BuilderSection {
  id: string;
  label: string;
  icon?: ReactNode;
  status: BuilderSectionStatus;
}

export interface BuilderFooterAction {
  id: string;
  label: string;
  variant?: "default" | "outline" | "destructive" | "ghost";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface BuilderStatusLabels {
  complete: string;
  partial: string;
  empty: string;
}

export interface BuilderPageShellProps {
  title: string;
  /** Subtítulo opcional bajo el título (homologa Hub/Form). */
  description?: string;
  backHref: string;
  backLabel?: string;
  statusBadge?: ReactNode;
  /** Alert / mensaje persistente bajo el header (p. ej. error API). */
  banner?: ReactNode;
  sections: BuilderSection[];
  activeSectionId: string;
  onSectionChange: (id: string) => void;
  renderCanvas: (sectionId: string) => ReactNode;
  renderInspector?: () => ReactNode;
  footerActions: BuilderFooterAction[];
  sectionsAriaLabel?: string;
  inspectorTitle?: string;
  canvasAriaLabel?: string;
  collapseInspectorLabel?: string;
  statusLabels?: BuilderStatusLabels;
  className?: string;
}

const DEFAULT_STATUS_LABELS: BuilderStatusLabels = {
  complete: "completo",
  partial: "parcial",
  empty: "vacío",
};

// ============================================================================
// HELPERS
// ============================================================================

const STATUS_DOT_CLASS: Record<BuilderSectionStatus, string> = {
  complete: "bg-success",
  partial: "bg-warning",
  empty: "bg-muted-foreground/35",
};

function SectionStatusDot({ status }: { status: BuilderSectionStatus }) {
  return (
    <span
      className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])}
      aria-hidden
    />
  );
}

function SectionNavButton({
  section,
  isActive,
  onSelect,
  layout,
  tabId,
  panelId,
  statusLabels,
  onKeyDown,
}: {
  section: BuilderSection;
  isActive: boolean;
  onSelect: () => void;
  layout: "vertical" | "horizontal";
  tabId: string;
  panelId: string;
  statusLabels: BuilderStatusLabels;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      aria-label={`${section.label} (${statusLabels[section.status]})`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center gap-2 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        layout === "vertical" &&
          "w-full rounded-md px-3 py-2 text-left hover:bg-muted/60",
        layout === "horizontal" &&
          "shrink-0 rounded-md border px-3 py-1.5 whitespace-nowrap",
        isActive &&
          layout === "vertical" &&
          "bg-primary/10 font-medium text-foreground",
        isActive &&
          layout === "horizontal" &&
          "border-primary bg-primary/10 font-medium",
        !isActive && "text-muted-foreground",
        !isActive &&
          layout === "horizontal" &&
          "border-transparent bg-muted/40",
      )}
    >
      <SectionStatusDot status={section.status} />
      {section.icon ? (
        <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
          {section.icon}
        </span>
      ) : null}
      <span className="truncate">{section.label}</span>
    </button>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

function BuilderPageShellInner({
  title,
  description,
  backHref,
  backLabel = "Volver",
  statusBadge,
  banner,
  sections,
  activeSectionId,
  onSectionChange,
  renderCanvas,
  renderInspector,
  footerActions,
  sectionsAriaLabel = "Secciones del builder",
  inspectorTitle = "Resumen",
  canvasAriaLabel = "Área de trabajo",
  collapseInspectorLabel = "Ocultar resumen",
  statusLabels = DEFAULT_STATUS_LABELS,
  className,
}: BuilderPageShellProps) {
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const hasInspector = Boolean(renderInspector);
  const reactId = useId();
  const panelId = `${reactId}-builder-panel`;

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const tablist = event.currentTarget.closest('[role="tablist"]');
      if (!tablist) return;

      const tabs = Array.from(
        tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
      );
      if (tabs.length === 0) return;

      const currentIndex = tabs.findIndex((tab) => tab === event.currentTarget);
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          event.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          event.preventDefault();
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const nextSection = sections[nextIndex];
      const nextTab = tabs[nextIndex];
      if (!nextSection || !nextTab) return;

      onSectionChange(nextSection.id);
      nextTab.focus();
    },
    [onSectionChange, sections],
  );

  const tabIdFor = (layout: "vertical" | "horizontal", sectionId: string) =>
    `${reactId}-tab-${layout}-${sectionId}`;

  return (
    <div className={cn("flex min-h-[calc(100vh-8rem)] flex-col", className)}>
      {/* Header */}
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" asChild>
            <Link to={backHref}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {backLabel}
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {statusBadge}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {hasInspector ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden"
              leftIcon={<PanelRight className="h-4 w-4" />}
              onClick={() => setMobileInspectorOpen(true)}
            >
              {inspectorTitle}
            </Button>
            {inspectorCollapsed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex"
                leftIcon={<PanelRight className="h-4 w-4" />}
                onClick={() => setInspectorCollapsed(false)}
              >
                {inspectorTitle}
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {banner ? <div className="mb-4">{banner}</div> : null}

      {/* Mobile section tabs */}
      <div
        role="tablist"
        aria-label={sectionsAriaLabel}
        aria-orientation="horizontal"
        className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
        data-testid="builder-section-nav-mobile"
      >
        {sections.map((section) => (
          <SectionNavButton
            key={section.id}
            section={section}
            isActive={section.id === activeSectionId}
            onSelect={() => onSectionChange(section.id)}
            layout="horizontal"
            tabId={tabIdFor("horizontal", section.id)}
            panelId={panelId}
            statusLabels={statusLabels}
            onKeyDown={handleTabKeyDown}
          />
        ))}
      </div>

      {/* Body: nav + canvas + inspector */}
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          hasInspector && !inspectorCollapsed
            ? "lg:grid-cols-[12rem_minmax(0,1fr)_18rem]"
            : "lg:grid-cols-[12rem_minmax(0,1fr)]",
        )}
      >
        {/* Desktop section nav */}
        <nav
          role="tablist"
          aria-label={sectionsAriaLabel}
          aria-orientation="vertical"
          className="hidden flex-col gap-1 rounded-lg border bg-muted/30 p-2 lg:flex"
          data-testid="builder-section-nav-desktop"
        >
          {sections.map((section) => (
            <SectionNavButton
              key={section.id}
              section={section}
              isActive={section.id === activeSectionId}
              onSelect={() => onSectionChange(section.id)}
              layout="vertical"
              tabId={tabIdFor("vertical", section.id)}
              panelId={panelId}
              statusLabels={statusLabels}
              onKeyDown={handleTabKeyDown}
            />
          ))}
        </nav>

        {/* Canvas — sin card chrome; FormSectionCard de feature aporta superficie */}
        <main
          id={panelId}
          role="tabpanel"
          aria-label={activeSection?.label ?? canvasAriaLabel}
          className="min-w-0 space-y-4"
        >
          {activeSection ? (
            <h2 className="text-lg font-semibold tracking-tight">
              {activeSection.label}
            </h2>
          ) : null}
          {renderCanvas(activeSectionId)}
        </main>

        {/* Desktop inspector */}
        {hasInspector && !inspectorCollapsed ? (
          <aside
            className="hidden min-w-0 rounded-lg border bg-card p-4 text-card-foreground shadow-sm lg:block"
            aria-label={inspectorTitle}
            data-testid="builder-inspector-desktop"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{inspectorTitle}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setInspectorCollapsed(true)}
                aria-label={collapseInspectorLabel}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
            {renderInspector?.()}
          </aside>
        ) : null}
      </div>

      {/* Footer */}
      {footerActions.length > 0 ? (
        <footer className="sticky bottom-0 z-10 mt-4 -mx-1 border-t bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-wrap justify-end gap-2">
            {footerActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant={action.variant ?? "default"}
                onClick={action.onClick}
                disabled={action.disabled}
                isLoading={action.loading}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </footer>
      ) : null}

      {/* Mobile inspector sheet */}
      {hasInspector ? (
        <Sheet open={mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{inspectorTitle}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{renderInspector?.()}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}

export const BuilderPageShell = memo(BuilderPageShellInner);

export default BuilderPageShell;
