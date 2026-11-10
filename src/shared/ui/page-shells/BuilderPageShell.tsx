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

/** Término de la barra de fórmula (variante `navVariant="formula"`). */
export interface BuilderFormulaTerm {
  id: string;
  /** p. ej. «1 · Por cada viaje» */
  label: string;
  /** Valor corto: «Ruta fija o clase de ruta» / «$1,200 por semana» */
  value: string;
  /** Resumen con completitud: «3 rutas fijas · 2 clases» */
  summary: string;
  status: BuilderSectionStatus;
  /** El 4º término (= Recibe) no navega a sección: enfoca inspector. */
  isResult?: boolean;
}

export type BuilderNavVariant = "rail" | "formula";

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
  /**
   * `rail` (default): nav lateral de secciones.
   * `formula`: barra de fórmula arriba del canvas+inspector (ds_evolution OK).
   */
  navVariant?: BuilderNavVariant;
  /** Requerido cuando `navVariant="formula"`. */
  formulaTerms?: BuilderFormulaTerm[];
  formulaAriaLabel?: string;
  /** Separadores entre términos (default + − =). */
  formulaOperators?: Array<"+" | "−" | "=">;
  /** Callback al elegir el término resultado (enfoca inspector). */
  onFormulaResultFocus?: () => void;
  /** Id del término resultado activo (resalta sin cambiar sección). */
  formulaResultActive?: boolean;
  /** Acciones del header a la derecha (ghost/outline/default). */
  headerActions?: ReactNode;
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

const FORMULA_STATUS_DOT_CLASS: Record<BuilderSectionStatus, string> = {
  complete: "bg-success",
  partial: "bg-warning",
  empty: "border-[1.5px] border-muted-foreground bg-transparent",
};

function SectionStatusDot({ status }: { status: BuilderSectionStatus }) {
  return (
    <span
      className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])}
      aria-hidden
    />
  );
}

function FormulaStatusDot({ status }: { status: BuilderSectionStatus }) {
  return (
    <span
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", FORMULA_STATUS_DOT_CLASS[status])}
      aria-hidden
    />
  );
}

function FormulaNav({
  terms,
  operators,
  activeSectionId,
  resultActive,
  ariaLabel,
  statusLabels,
  onSelect,
  onResultFocus,
}: {
  terms: BuilderFormulaTerm[];
  operators: Array<"+" | "−" | "=">;
  activeSectionId: string;
  resultActive: boolean;
  ariaLabel: string;
  statusLabels: BuilderStatusLabels;
  onSelect: (id: string) => void;
  onResultFocus?: () => void;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      data-testid="builder-formula-nav"
      className="mb-4 grid items-stretch gap-0 rounded-xl border bg-card p-2"
      style={{
        gridTemplateColumns: terms
          .map((_, index) => (index === terms.length - 1 ? "1.15fr" : "1fr"))
          .flatMap((col, index) => (index === 0 ? [col] : ["28px", col]))
          .join(" "),
      }}
    >
      {terms.map((term, index) => {
        const isActive = term.isResult
          ? resultActive
          : !resultActive && term.id === activeSectionId;
        const op = operators[index];
        return (
          <div key={term.id} className="contents">
            {index > 0 ? (
              <div
                className="flex items-center justify-center text-xl font-medium text-muted-foreground"
                aria-hidden
              >
                {op ?? "+"}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (term.isResult) {
                  onResultFocus?.();
                  return;
                }
                onSelect(term.id);
              }}
              aria-current={isActive ? "true" : undefined}
              aria-label={`${term.label}: ${term.value} (${statusLabels[term.status]})`}
              className={cn(
                "flex flex-col gap-1 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
                "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive &&
                  "border-primary bg-primary/10 shadow-[inset_0_-3px_0_0_hsl(var(--primary))]",
                term.isResult && !isActive && "bg-secondary",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold text-muted-foreground",
                  isActive && "text-primary",
                )}
              >
                {term.label}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  term.isResult && "font-mono text-lg leading-6",
                  term.status === "empty" && !term.isResult && "font-medium text-muted-foreground",
                )}
              >
                {term.value}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {!term.isResult ? <FormulaStatusDot status={term.status} /> : null}
                {term.summary}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
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
  navVariant = "rail",
  formulaTerms,
  formulaAriaLabel = "Cómo se calcula el pago (secciones de la tarifa)",
  formulaOperators = ["+", "−", "="],
  onFormulaResultFocus,
  formulaResultActive = false,
  headerActions,
}: BuilderPageShellProps) {
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const hasInspector = Boolean(renderInspector);
  const isFormula = navVariant === "formula";
  const reactId = useId();
  const panelId = `${reactId}-builder-panel`;

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];

  const openInspector = useCallback(() => {
    setInspectorCollapsed(false);
    setMobileInspectorOpen(true);
    onFormulaResultFocus?.();
  }, [onFormulaResultFocus]);

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
          {!isFormula ? (
            <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" asChild>
              <Link to={backHref}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {backLabel}
              </Link>
            </Button>
          ) : (
            <nav aria-label="Migas" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Link to={backHref} className="hover:text-foreground hover:underline">
                {backLabel}
              </Link>
              <span aria-hidden>/</span>
              <span className="font-medium text-foreground">{title}</span>
            </nav>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {statusBadge}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {headerActions}
          {hasInspector ? (
            <>
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
            </>
          ) : null}
        </div>
      </header>

      {banner ? <div className="mb-4">{banner}</div> : null}

      {isFormula && formulaTerms && formulaTerms.length > 0 ? (
        <FormulaNav
          terms={formulaTerms}
          operators={formulaOperators}
          activeSectionId={activeSectionId}
          resultActive={formulaResultActive}
          ariaLabel={formulaAriaLabel}
          statusLabels={statusLabels}
          onSelect={onSectionChange}
          onResultFocus={openInspector}
        />
      ) : null}

      {/* Mobile section tabs (rail only; formula usa la barra arriba) */}
      {!isFormula ? (
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
      ) : (
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
              isActive={!formulaResultActive && section.id === activeSectionId}
              onSelect={() => onSectionChange(section.id)}
              layout="horizontal"
              tabId={tabIdFor("horizontal", section.id)}
              panelId={panelId}
              statusLabels={statusLabels}
              onKeyDown={handleTabKeyDown}
            />
          ))}
        </div>
      )}

      {/* Body: nav + canvas + inspector */}
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          isFormula
            ? hasInspector && !inspectorCollapsed
              ? "lg:grid-cols-[minmax(0,1fr)_21rem]"
              : "lg:grid-cols-[minmax(0,1fr)]"
            : hasInspector && !inspectorCollapsed
              ? "lg:grid-cols-[12rem_minmax(0,1fr)_18rem]"
              : "lg:grid-cols-[12rem_minmax(0,1fr)]",
        )}
      >
        {/* Desktop section nav (rail) */}
        {!isFormula ? (
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
        ) : null}

        {/* Canvas — sin card chrome; FormSectionCard de feature aporta superficie */}
        <main
          id={panelId}
          role="tabpanel"
          aria-label={activeSection?.label ?? canvasAriaLabel}
          className={cn(
            "min-w-0 space-y-4",
            isFormula && "rounded-xl border bg-card p-5 text-card-foreground",
          )}
        >
          {activeSection ? (
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {activeSection.label}
              </h2>
            </div>
          ) : null}
          {renderCanvas(activeSectionId)}
        </main>

        {/* Desktop inspector */}
        {hasInspector && !inspectorCollapsed ? (
          <aside
            className={cn(
              "hidden min-w-0 text-card-foreground lg:block",
              isFormula
                ? "sticky top-4 self-start space-y-4"
                : "rounded-lg border bg-card p-4 shadow-sm",
            )}
            aria-label={inspectorTitle}
            data-testid="builder-inspector-desktop"
          >
            {!isFormula ? (
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
            ) : null}
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
