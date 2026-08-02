/**
 * DesignSystemPage
 *
 * Página interna de referencia visual del Design System de Tlama (Boeltech).
 *
 * Acceso: gated a admin (vía AdminRoute en routes.tsx).
 * Propósito:
 *   - Documentación viva del DS (tokens, tipografía, componentes, patrones).
 *   - Onboarding visual de futuros devs.
 *   - QA visual rápido (light + dark mode).
 *
 * No reemplaza Storybook — es un complemento liviano que vive
 * dentro de la app y siempre refleja el estado real de los tokens.
 *
 * Ubicación: src/pages/design-system/DesignSystemPage.tsx
 */

import { useState } from "react";
import {
  Palette,
  Type,
  Layers,
  BarChart3,
  Activity,
  FormInput,
  PanelRight,
  MessageSquareWarning,
  LayoutTemplate,
  PanelLeft,
  Map,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { BrandLockup } from "@shared/ui/brand";
import { ThemeCycleButton } from "@shared/ui/theme";
import { ColorPaletteSection } from "./sections/ColorPaletteSection";
import { TypographySection } from "./sections/TypographySection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { FormsSection } from "./sections/FormsSection";
import { OverlaysSection } from "./sections/OverlaysSection";
import { FeedbackSection } from "./sections/FeedbackSection";
import { StatusSection } from "./sections/StatusSection";
import { ChartPaletteSection } from "./sections/ChartPaletteSection";
import { PatternsSection } from "./sections/PatternsSection";
import { AppShellSection } from "./sections/AppShellSection";
import { MapsEmbedsSection } from "./sections/MapsEmbedsSection";

type SectionKey =
  | "colors"
  | "typography"
  | "components"
  | "forms"
  | "overlays"
  | "feedback"
  | "status"
  | "charts"
  | "app-shell"
  | "patterns"
  | "maps-embeds";

interface SectionConfig {
  key: SectionKey;
  label: string;
  icon: typeof Palette;
  description: string;
  /** Agrupador visual para no saturar el nav. */
  group: "Foundations" | "Components" | "Patterns";
}

const SECTIONS: readonly SectionConfig[] = [
  {
    key: "colors",
    label: "Color",
    icon: Palette,
    description: "Paleta primary, tokens semánticos y soft variants",
    group: "Foundations",
  },
  {
    key: "typography",
    label: "Tipografía",
    icon: Type,
    description: "Inter + JetBrains Mono, escala y feature settings",
    group: "Foundations",
  },
  {
    key: "components",
    label: "Botones & badges",
    icon: Layers,
    description: "Button y Badge con todas sus variantes",
    group: "Components",
  },
  {
    key: "forms",
    label: "Formularios",
    icon: FormInput,
    description: "Input, Label, Textarea, Select, Checkbox, Switch",
    group: "Components",
  },
  {
    key: "overlays",
    label: "Overlays",
    icon: PanelRight,
    description: "Dialog, Sheet, Popover, Tooltip y Toast",
    group: "Components",
  },
  {
    key: "feedback",
    label: "Feedback",
    icon: MessageSquareWarning,
    description: "Alert, EmptyState y LoadingPageState",
    group: "Components",
  },
  {
    key: "status",
    label: "Status & KPIs",
    icon: Activity,
    description: "StatusBadge, StatCard y composiciones de dashboard",
    group: "Components",
  },
  {
    key: "charts",
    label: "Charts",
    icon: BarChart3,
    description: "Paleta alineada a la marca para visualizaciones",
    group: "Components",
  },
  {
    key: "app-shell",
    label: "App Shell",
    icon: PanelLeft,
    description:
      "Chrome global: LayoutShell, sidebar, header, providers y toast",
    group: "Patterns",
  },
  {
    key: "patterns",
    label: "Patrones",
    icon: LayoutTemplate,
    description:
      "Page shells, jerarquía tipográfica, spacing y master-detail",
    group: "Patterns",
  },
  {
    key: "maps-embeds",
    label: "Mapas + embeds",
    icon: Map,
    description:
      "Mapbox reactivo al tema, capas dinámicas y checklist para embeds externos",
    group: "Patterns",
  },
] as const;

const GROUPS = ["Foundations", "Components", "Patterns"] as const;

export function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("colors");
  const activeConfig = SECTIONS.find((s) => s.key === activeSection);

  return (
    <div className="space-y-8">
      {/* ============================================
       *  Header
       *  ============================================ */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <BrandLockup
                variant="brand"
                markSize={36}
                wordmarkClassName="text-3xl"
              />
              <Badge variant="info" tone="soft">
                Design System
              </Badge>
              <Badge variant="neutral" tone="soft">
                Fase 4
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Referencia visual viva del sistema de diseño de Tlama.
              Refleja el estado real de los tokens en{" "}
              <code className="font-mono text-xs">
                src/app/styles/index.css
              </code>
              .
            </p>
          </div>
          <ThemeCycleButton variant="outline" />
        </div>
      </header>

      {/* ============================================
       *  Section tabs — agrupados por categoría
       *  ============================================ */}
      <nav className="space-y-3 border-b pb-4">
        {GROUPS.map((group) => {
          const groupSections = SECTIONS.filter((s) => s.group === group);
          return (
            <div key={group} className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              <div className="flex flex-wrap gap-2">
                {groupSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.key;
                  return (
                    <Button
                      key={section.key}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveSection(section.key)}
                      leftIcon={<Icon className="h-4 w-4" />}
                    >
                      {section.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ============================================
       *  Section description
       *  ============================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{activeConfig?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {activeConfig?.description}
          </p>
        </CardContent>
      </Card>

      {/* ============================================
       *  Active section content
       *  ============================================ */}
      <div className="pb-12">
        {activeSection === "colors" && <ColorPaletteSection />}
        {activeSection === "typography" && <TypographySection />}
        {activeSection === "components" && <ComponentsSection />}
        {activeSection === "forms" && <FormsSection />}
        {activeSection === "overlays" && <OverlaysSection />}
        {activeSection === "feedback" && <FeedbackSection />}
        {activeSection === "status" && <StatusSection />}
        {activeSection === "charts" && <ChartPaletteSection />}
        {activeSection === "app-shell" && <AppShellSection />}
        {activeSection === "patterns" && <PatternsSection />}
        {activeSection === "maps-embeds" && <MapsEmbedsSection />}
      </div>
    </div>
  );
}

export default DesignSystemPage;
