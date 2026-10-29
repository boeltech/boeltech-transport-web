import { useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  Contrast,
  LayoutTemplate,
  Layers,
  Palette,
  Ruler,
  Sparkles,
  Type,
} from "lucide-react";
import { isPlatformOwner } from "../../../domain/entities";
import { usePlatformAuth } from "../../providers/PlatformAuthProvider";
import { opsCopy } from "../opsCopy";
import { OpsBadge } from "../ui/OpsBadge";
import { OpsButton } from "../ui/OpsButton";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelTitle,
} from "../ui/OpsPanel";
import { OpsBrandSection } from "./sections/OpsBrandSection";
import { OpsColorSection } from "./sections/OpsColorSection";
import { OpsComponentsCatalogSection } from "./sections/OpsComponentsCatalogSection";
import { OpsContrastSection } from "./sections/OpsContrastSection";
import { OpsDensitySection } from "./sections/OpsDensitySection";
import { OpsPatternsCatalogSection } from "./sections/OpsPatternsCatalogSection";
import { OpsTypographySection } from "./sections/OpsTypographySection";

type SectionKey =
  | "brand"
  | "color"
  | "typography"
  | "density"
  | "contrast"
  | "components"
  | "patterns";

type PreviewTheme = "light" | "dark";

interface SectionConfig {
  key: SectionKey;
  label: string;
  icon: typeof Palette;
  description: string;
  group: "Foundations" | "Components" | "Patterns";
}

const SECTIONS: readonly SectionConfig[] = [
  {
    key: "brand",
    label: opsCopy.designSystem.sections.brand,
    icon: Sparkles,
    description: "Wordmark · monograma · motivos M1–M6 sí/no",
    group: "Foundations",
  },
  {
    key: "color",
    label: opsCopy.designSystem.sections.color,
    icon: Palette,
    description:
      "Roles --ops-* · acero Mando · notice · neutros fríos · anti #0969DA",
    group: "Foundations",
  },
  {
    key: "typography",
    label: opsCopy.designSystem.sections.typography,
    icon: Type,
    description: "IBM Plex Sans + Mono · display / title / body / caption",
    group: "Foundations",
  },
  {
    key: "density",
    label: opsCopy.designSystem.sections.density,
    icon: Ruler,
    description: "Row 37 · radius 3 · hairline > sombra · ladder superficies",
    group: "Foundations",
  },
  {
    key: "contrast",
    label: opsCopy.designSystem.sections.contrast,
    icon: Contrast,
    description: "AA medido light+dark · ratios calculados",
    group: "Foundations",
  },
  {
    key: "components",
    label: opsCopy.designSystem.sections.components,
    icon: Layers,
    description:
      "Matriz estados · outline/loading · checks · spinner · Command · overlays",
    group: "Components",
  },
  {
    key: "patterns",
    label: opsCopy.designSystem.sections.patterns,
    icon: LayoutTemplate,
    description:
      "Inventario craft A · Hub/Hoy · Money · Empty/loading · Risk",
    group: "Patterns",
  },
] as const;

const GROUPS = ["Foundations", "Components", "Patterns"] as const;

const GROUP_LABEL: Record<(typeof GROUPS)[number], string> = {
  Foundations: opsCopy.designSystem.groups.foundations,
  Components: opsCopy.designSystem.groups.components,
  Patterns: opsCopy.designSystem.groups.patterns,
};

function PreviewRoot({
  theme,
  children,
}: {
  theme: PreviewTheme;
  children: ReactNode;
}) {
  return (
    <div
      className="platform-ops ops-rounded ops-hairline ops-bg space-y-4 p-4"
      data-ops-theme={theme}
      data-testid="ops-ds-preview-root"
      data-ops-ds-preview={theme}
    >
      {children}
    </div>
  );
}

/**
 * Referencia viva Ops Foundations (`/platform/design-system`).
 * Solo platform_owner. Preview light/dark local — sin ThemeCycle ERP (LID-D* · L3).
 */
export function PlatformOpsDesignSystemPage() {
  const { user } = usePlatformAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>("brand");
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light");

  if (!isPlatformOwner(user?.platformRole)) {
    return <Navigate to="/platform" replace />;
  }

  const activeConfig = SECTIONS.find((s) => s.key === activeSection);
  const ds = opsCopy.designSystem;
  /** Contraste ya monta dos raíces light/dark — no anidar preview. */
  const usePreviewWrapper = activeSection !== "contrast";

  const sectionBody = (
    <>
      {activeSection === "brand" ? <OpsBrandSection /> : null}
      {activeSection === "color" ? <OpsColorSection /> : null}
      {activeSection === "typography" ? <OpsTypographySection /> : null}
      {activeSection === "density" ? <OpsDensitySection /> : null}
      {activeSection === "contrast" ? <OpsContrastSection /> : null}
      {activeSection === "components" ? (
        <OpsComponentsCatalogSection />
      ) : null}
      {activeSection === "patterns" ? <OpsPatternsCatalogSection /> : null}
    </>
  );

  return (
    <div
      className="space-y-6"
      data-testid="platform-ops-design-system"
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="ops-type-display ops-text m-0">{ds.brand}</h1>
          <OpsBadge tone="muted">{ds.badge}</OpsBadge>
        </div>
        <p className="ops-type-body ops-text-muted m-0">{ds.subtitle}</p>
      </header>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={ds.preview.label}
        data-testid="ops-ds-preview-switch"
      >
        <span className="ops-type-caption ops-text-muted">
          {ds.preview.label}
        </span>
        <OpsButton
          variant={previewTheme === "light" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setPreviewTheme("light")}
          aria-pressed={previewTheme === "light"}
          data-testid="ops-ds-preview-light"
        >
          {ds.preview.light}
        </OpsButton>
        <OpsButton
          variant={previewTheme === "dark" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setPreviewTheme("dark")}
          aria-pressed={previewTheme === "dark"}
          data-testid="ops-ds-preview-dark"
        >
          {ds.preview.dark}
        </OpsButton>
        <span className="ops-type-caption ops-text-muted">
          {ds.preview.hint}
        </span>
      </div>

      <nav
        className="space-y-3 border-b ops-border pb-4"
        aria-label="Secciones Design System Ops"
      >
        {GROUPS.map((group) => {
          const groupSections = SECTIONS.filter((s) => s.group === group);
          return (
            <div key={group} className="space-y-2">
              <p className="ops-type-caption ops-text-muted">
                {GROUP_LABEL[group]}
              </p>
              <div className="flex flex-wrap gap-2">
                {groupSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.key;
                  return (
                    <OpsButton
                      key={section.key}
                      variant={isActive ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveSection(section.key)}
                      aria-current={isActive ? "true" : undefined}
                      data-testid={`ops-ds-nav-${section.key}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {section.label}
                    </OpsButton>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <OpsPanel>
        <OpsPanelBody className="space-y-1 !pt-3">
          <OpsPanelTitle>{activeConfig?.label}</OpsPanelTitle>
          <p className="ops-type-caption ops-text-muted m-0">
            {activeConfig?.description}
          </p>
        </OpsPanelBody>
      </OpsPanel>

      <div className="pb-8">
        {usePreviewWrapper ? (
          <PreviewRoot theme={previewTheme}>{sectionBody}</PreviewRoot>
        ) : (
          sectionBody
        )}
      </div>
    </div>
  );
}

export default PlatformOpsDesignSystemPage;
