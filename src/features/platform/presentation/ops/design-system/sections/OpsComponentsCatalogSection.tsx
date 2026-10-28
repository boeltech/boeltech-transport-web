import { useState } from "react";
import { OpsTableSkeleton } from "../../patterns/OpsTableSkeleton";
import {
  OpsAlert,
  OpsBadge,
  OpsButton,
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsDialogTitle,
  OpsFieldError,
  OpsInput,
  OpsLabel,
  OpsLifecycleSeal,
  OpsPlanSeal,
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetHeader,
  OpsSheetTitle,
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
  OpsTextarea,
} from "../../ui";

export function OpsComponentsCatalogSection() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4" data-testid="ops-ds-components">
      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Botones & badges</OpsPanelTitle>
          <OpsPanelDescription>
            Solo primitivos <code>ops/ui</code>. Cero Card/Badge/Button ERP.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="flex flex-wrap items-center gap-2">
          <OpsButton>Primary</OpsButton>
          <OpsButton variant="ghost">Ghost</OpsButton>
          <OpsButton variant="danger">Danger</OpsButton>
          <OpsButton size="sm">Small</OpsButton>
          <OpsButton variant="primary" disabled>
            Primary disabled
          </OpsButton>
          <OpsBadge>default</OpsBadge>
          <OpsBadge tone="muted">muted</OpsBadge>
          <OpsBadge tone="accent">accent</OpsBadge>
          <OpsBadge tone="ok">ok</OpsBadge>
          <OpsBadge tone="warn">warn</OpsBadge>
          <OpsBadge tone="danger">danger</OpsBadge>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Sellos</OpsPanelTitle>
          <OpsPanelDescription>
            Etapa con barra de 3px. Trial es tinta. El plan es código mono.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <OpsLifecycleSeal tone="ok">Activa</OpsLifecycleSeal>
            <OpsLifecycleSeal tone="warn">Cobro pendiente</OpsLifecycleSeal>
            <OpsLifecycleSeal tone="danger">Suspendida</OpsLifecycleSeal>
            <OpsLifecycleSeal tone="trial">En prueba</OpsLifecycleSeal>
            <OpsPlanSeal name="Control" />
            <OpsPlanSeal />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="ops-type-caption ops-text-muted">platform_owner</span>
            <OpsLifecycleSeal tone="danger">Suspendida</OpsLifecycleSeal>
            <OpsButton variant="danger" size="sm">
              Suspender
            </OpsButton>
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="ops-ds-reader"
          >
            <span className="ops-type-caption ops-text-muted">
              platform_support
            </span>
            <OpsLifecycleSeal tone="danger">Suspendida</OpsLifecycleSeal>
            <OpsPlanSeal name="Control" />
            <span className="ops-type-caption ops-text-muted">Solo lectura</span>
          </div>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Formularios</OpsPanelTitle>
        </OpsPanelHeader>
        <OpsPanelBody className="grid max-w-md gap-3">
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-input">Empresa</OpsLabel>
            <OpsInput id="ops-ds-input" placeholder="Subdomain…" />
          </div>
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-err">Con error</OpsLabel>
            <OpsInput
              id="ops-ds-err"
              data-error="true"
              defaultValue="x"
              aria-invalid
              aria-describedby="ops-ds-err-error"
            />
            <OpsFieldError fieldId="ops-ds-err" message="Campo obligatorio" />
          </div>
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-ta">Nota</OpsLabel>
            <OpsTextarea id="ops-ds-ta" placeholder="Razón de auditoría…" />
          </div>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Panel & tabla</OpsPanelTitle>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <OpsTable>
            <OpsTableHeader>
              <OpsTableRow>
                <OpsTableHead>Empresa</OpsTableHead>
                <OpsTableHead>Etapa</OpsTableHead>
              </OpsTableRow>
            </OpsTableHeader>
            <OpsTableBody>
              <OpsTableRow>
                <OpsTableCell>Acme Logística</OpsTableCell>
                <OpsTableCell>
                  <OpsBadge tone="ok">Activa</OpsBadge>
                </OpsTableCell>
              </OpsTableRow>
              <OpsTableRow>
                <OpsTableCell>Beta Freight</OpsTableCell>
                <OpsTableCell>
                  <OpsBadge tone="warn">Cobro pendiente</OpsBadge>
                </OpsTableCell>
              </OpsTableRow>
            </OpsTableBody>
          </OpsTable>
          <OpsTableSkeleton />
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Overlays & feedback</OpsPanelTitle>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <OpsButton variant="ghost" onClick={() => setSheetOpen(true)}>
              Abrir sheet
            </OpsButton>
            <OpsButton variant="ghost" onClick={() => setDialogOpen(true)}>
              Abrir dialog
            </OpsButton>
          </div>
          <OpsAlert tone="warn" title="Cobro pendiente">
            Cobro SaaS pendiente — no es CFDI de transporte.
          </OpsAlert>
          <OpsAlert tone="danger" title="Suspensión">
            Confirmación tipada antes de suspender.
          </OpsAlert>
        </OpsPanelBody>
      </OpsPanel>

      <OpsSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <OpsSheetContent side="right">
          <OpsSheetHeader>
            <OpsSheetTitle>Sheet Ops</OpsSheetTitle>
            <OpsSheetDescription>
              Elevated (`--ops-bg-elevated`) — sin Sheet ERP.
            </OpsSheetDescription>
          </OpsSheetHeader>
          <p className="ops-type-body ops-text-muted">
            Stub de catálogo Foundations.
          </p>
        </OpsSheetContent>
      </OpsSheet>

      <OpsDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <OpsDialogContent>
          <OpsDialogHeader>
            <OpsDialogTitle>Dialog Ops</OpsDialogTitle>
            <OpsDialogDescription>
              Confirmaciones tipadas usan tono danger.
            </OpsDialogDescription>
          </OpsDialogHeader>
          <OpsDialogFooter>
            <OpsButton variant="ghost" onClick={() => setDialogOpen(false)}>
              Cerrar
            </OpsButton>
            <OpsButton onClick={() => setDialogOpen(false)}>Entendido</OpsButton>
          </OpsDialogFooter>
        </OpsDialogContent>
      </OpsDialog>
    </div>
  );
}
