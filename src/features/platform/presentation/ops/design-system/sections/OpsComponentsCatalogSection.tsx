import { useState, type ReactNode } from "react";
import { OpsTableSkeleton } from "../../patterns/OpsTableSkeleton";
import {
  OpsAlert,
  OpsBadge,
  OpsButton,
  OpsCheckbox,
  OpsCommand,
  OpsCommandEmpty,
  OpsCommandGroup,
  OpsCommandInput,
  OpsCommandItem,
  OpsCommandList,
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsDialogTitle,
  OpsFieldError,
  OpsFormErrors,
  OpsInput,
  OpsLabel,
  OpsLifecycleSeal,
  OpsPlanSeal,
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
  OpsRadio,
  OpsRadioGroup,
  OpsSelect,
  OpsSelectContent,
  OpsSelectItem,
  OpsSelectTrigger,
  OpsSelectValue,
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetFooter,
  OpsSheetHeader,
  OpsSheetTitle,
  OpsSpinner,
  OpsSwitch,
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableEllipsis,
  OpsTableHead,
  OpsTableHeader,
  OpsTablePrimary,
  OpsTableRow,
  OpsTableStatus,
  OpsTextarea,
  type OpsButtonVariant,
} from "../../ui";

function MatrixCaption({ children }: { children: ReactNode }) {
  return (
    <p className="ops-type-caption ops-text-muted m-0 min-w-[4.5rem] shrink-0">
      {children}
    </p>
  );
}

function MatrixRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MatrixCaption>{label}</MatrixCaption>
      {children}
    </div>
  );
}

const BUTTON_VARIANTS: readonly {
  variant: OpsButtonVariant;
  label: string;
}[] = [
  { variant: "solid", label: "Solid" },
  { variant: "outline", label: "Outline" },
  { variant: "ghost", label: "Ghost" },
  { variant: "danger", label: "Danger" },
];

/**
 * Vitrina Components — craft A · matriz de estados (P6).
 * Hover/focus forzados vía `data-ops-force` (CSS vitrina).
 */
export function OpsComponentsCatalogSection() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [plan, setPlan] = useState("control");
  const [cmdEmptyQuery, setCmdEmptyQuery] = useState("zzzz-sin-match");

  return (
    <div className="space-y-4" data-testid="ops-ds-components">
      <OpsPanel data-testid="ops-ds-matrix-buttons">
        <OpsPanelHeader>
          <OpsPanelTitle>Botones — matriz de estados</OpsPanelTitle>
          <OpsPanelDescription>
            solid / outline / ghost / danger · default · hover · focus ·
            disabled · loading. Primary = acero (<code>--ops-accent</code>), no
            #0969DA. Hover/focus = <code>data-ops-force</code> (vitrina).
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          {BUTTON_VARIANTS.map(({ variant, label }) => (
            <div key={variant} className="space-y-2">
              <p className="ops-type-caption ops-text m-0 font-medium">
                {label}
              </p>
              <MatrixRow label="default">
                <OpsButton variant={variant}>{label}</OpsButton>
              </MatrixRow>
              <MatrixRow label="hover">
                <OpsButton variant={variant} data-ops-force="hover">
                  {label}
                </OpsButton>
              </MatrixRow>
              <MatrixRow label="focus">
                <OpsButton variant={variant} data-ops-force="focus">
                  {label}
                </OpsButton>
              </MatrixRow>
              <MatrixRow label="disabled">
                <OpsButton variant={variant} disabled>
                  {label}
                </OpsButton>
              </MatrixRow>
              <MatrixRow label="loading">
                <OpsButton variant={variant} loading>
                  Guardando
                </OpsButton>
              </MatrixRow>
            </div>
          ))}
          <MatrixRow label="sizes">
            <OpsButton size="sm">Small</OpsButton>
            <OpsButton variant="primary" disabled>
              Primary disabled
            </OpsButton>
          </MatrixRow>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel data-testid="ops-ds-matrix-badges">
        <OpsPanelHeader>
          <OpsPanelTitle>Badges & sellos</OpsPanelTitle>
          <OpsPanelDescription>
            Pills metadata (tono suave + texto) · sellos lifecycle/plan. No chips
            marketing.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <OpsBadge>default</OpsBadge>
            <OpsBadge tone="muted">muted</OpsBadge>
            <OpsBadge tone="accent">accent</OpsBadge>
            <OpsBadge tone="ok">ok</OpsBadge>
            <OpsBadge tone="warn">warn</OpsBadge>
            <OpsBadge tone="danger">danger</OpsBadge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OpsLifecycleSeal tone="ok">Activa</OpsLifecycleSeal>
            <OpsLifecycleSeal tone="warn">Cobro pendiente</OpsLifecycleSeal>
            <OpsLifecycleSeal tone="danger">Suspendida</OpsLifecycleSeal>
            <OpsLifecycleSeal tone="trial">En prueba</OpsLifecycleSeal>
            <OpsPlanSeal name="Control" />
            <OpsPlanSeal />
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

      <OpsPanel data-testid="ops-ds-matrix-forms">
        <OpsPanelHeader>
          <OpsPanelTitle>Formularios — matriz</OpsPanelTitle>
          <OpsPanelDescription>
            Hairline idle · focus acero · placeholder muted · error · disabled ·
            Select · FormErrors.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="grid max-w-lg gap-4">
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-input">default</OpsLabel>
            <OpsInput id="ops-ds-input" placeholder="Subdomain…" />
          </div>
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-focus">focus (forzado)</OpsLabel>
            <OpsInput
              id="ops-ds-focus"
              placeholder="Focus acero…"
              data-ops-force="focus"
              data-testid="ops-ds-input-force-focus"
            />
          </div>
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-err">error</OpsLabel>
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
            <OpsLabel htmlFor="ops-ds-disabled">disabled</OpsLabel>
            <OpsInput id="ops-ds-disabled" disabled placeholder="No editable" />
          </div>
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-ta">Textarea</OpsLabel>
            <OpsTextarea id="ops-ds-ta" placeholder="Razón de auditoría…" />
          </div>
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-ta-focus">Textarea focus</OpsLabel>
            <OpsTextarea
              id="ops-ds-ta-focus"
              placeholder="Focus…"
              data-ops-force="focus"
            />
          </div>
          <div className="space-y-1">
            <OpsLabel htmlFor="ops-ds-select">Select</OpsLabel>
            <OpsSelect value={plan} onValueChange={setPlan}>
              <OpsSelectTrigger id="ops-ds-select" aria-label="Plan">
                <OpsSelectValue placeholder="Elegir plan…" />
              </OpsSelectTrigger>
              <OpsSelectContent>
                <OpsSelectItem value="control">Control</OpsSelectItem>
                <OpsSelectItem value="scale">Scale</OpsSelectItem>
                <OpsSelectItem value="disabled" disabled>
                  No disponible
                </OpsSelectItem>
              </OpsSelectContent>
            </OpsSelect>
          </div>
          <OpsFormErrors
            messages={[
              { id: "ops-ds-err", message: "Campo obligatorio" },
              "Confirma el plan antes de guardar",
            ]}
          />
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel data-testid="ops-ds-matrix-controls">
        <OpsPanelHeader>
          <OpsPanelTitle>Checks · radios · switch · spinner</OpsPanelTitle>
          <OpsPanelDescription>
            Controles in-kit (craft A). No Checkbox/Switch ERP. Spinner inline +
            bloque (= <code>--ops-skeleton</code>).
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <OpsCheckbox label="Notificar al admin" defaultChecked />
            <OpsCheckbox label="Disabled" disabled />
            <OpsCheckbox label="Focus" data-ops-force="focus" defaultChecked />
            <OpsSwitch label="Auto-cargo" defaultChecked />
            <OpsSwitch label="Off" />
            <OpsSwitch label="Focus" data-ops-force="focus" />
          </div>
          <OpsRadioGroup legend="Alcance" orientation="horizontal">
            <OpsRadio
              name="ops-ds-scope"
              value="tenant"
              label="Empresa"
              defaultChecked
            />
            <OpsRadio name="ops-ds-scope" value="plan" label="Plan" />
            <OpsRadio
              name="ops-ds-scope"
              value="all"
              label="Todos"
              disabled
            />
          </OpsRadioGroup>
          <div className="flex flex-wrap items-center gap-4">
            <OpsSpinner size="sm" />
            <OpsSpinner size="md" />
            <div className="ops-hairline ops-rounded w-40">
              <OpsSpinner variant="block" label="Cargando bloque" />
            </div>
          </div>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel data-testid="ops-ds-matrix-table">
        <OpsPanelHeader>
          <OpsPanelTitle>Panel & tabla</OpsPanelTitle>
          <OpsPanelDescription>
            Status-icon circular (✓/✗) a la izquierda · título/meta · menú ….
            Densidad row 37 · hairline, no card elevada · sin barra danger gruesa.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <OpsTable>
            <OpsTableHeader>
              <OpsTableRow>
                <OpsTableHead>Corrida</OpsTableHead>
                <OpsTableHead>Etapa</OpsTableHead>
                <OpsTableHead className="w-10">
                  <span className="sr-only">Acciones</span>
                </OpsTableHead>
              </OpsTableRow>
            </OpsTableHeader>
            <OpsTableBody>
              <OpsTableRow>
                <OpsTableCell>
                  <div className="ops-table-cell-lead">
                    <OpsTableStatus tone="ok" label="Completado" />
                    <OpsTablePrimary
                      title="deploy-staging"
                      meta={<OpsBadge tone="muted">main</OpsBadge>}
                    />
                  </div>
                </OpsTableCell>
                <OpsTableCell>
                  <OpsBadge tone="ok">Activa</OpsBadge>
                </OpsTableCell>
                <OpsTableCell>
                  <OpsTableEllipsis />
                </OpsTableCell>
              </OpsTableRow>
              <OpsTableRow>
                <OpsTableCell>
                  <div className="ops-table-cell-lead">
                    <OpsTableStatus tone="danger" label="Falló" />
                    <OpsTablePrimary title="ci · unit" meta="hace 12 min" />
                  </div>
                </OpsTableCell>
                <OpsTableCell>
                  <OpsBadge tone="danger">Falló</OpsBadge>
                </OpsTableCell>
                <OpsTableCell>
                  <OpsTableEllipsis />
                </OpsTableCell>
              </OpsTableRow>
              <OpsTableRow>
                <OpsTableCell>
                  <div className="ops-table-cell-lead">
                    <OpsTableStatus tone="warn" label="En curso" />
                    <OpsTablePrimary
                      title="backfill-fleet"
                      meta="branch · ops"
                    />
                  </div>
                </OpsTableCell>
                <OpsTableCell>
                  <OpsBadge tone="warn">En curso</OpsBadge>
                </OpsTableCell>
                <OpsTableCell>
                  <OpsTableEllipsis />
                </OpsTableCell>
              </OpsTableRow>
            </OpsTableBody>
          </OpsTable>
          <OpsTableSkeleton />
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel data-testid="ops-ds-matrix-command">
        <OpsPanelHeader>
          <OpsPanelTitle>Command</OpsPanelTitle>
          <OpsPanelDescription>
            Palette: input + lista + empty (sin matches).
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="grid gap-3 md:grid-cols-2">
          <div
            className="ops-hairline ops-rounded overflow-hidden"
            data-testid="ops-ds-command-demo"
          >
            <OpsCommand>
              <OpsCommandInput placeholder="Buscar acción…" />
              <OpsCommandList>
                <OpsCommandEmpty>Sin resultados</OpsCommandEmpty>
                <OpsCommandGroup heading="Navegación">
                  <OpsCommandItem value="hoy">Hoy</OpsCommandItem>
                  <OpsCommandItem value="tenants">Empresas</OpsCommandItem>
                  <OpsCommandItem value="ar">Cobranza SaaS</OpsCommandItem>
                </OpsCommandGroup>
              </OpsCommandList>
            </OpsCommand>
          </div>
          <div
            className="ops-hairline ops-rounded overflow-hidden"
            data-testid="ops-ds-command-empty"
          >
            <OpsCommand shouldFilter>
              <OpsCommandInput
                placeholder="Buscar acción…"
                value={cmdEmptyQuery}
                onValueChange={setCmdEmptyQuery}
              />
              <OpsCommandList>
                <OpsCommandEmpty>Sin resultados</OpsCommandEmpty>
                <OpsCommandGroup heading="Navegación">
                  <OpsCommandItem value="hoy">Hoy</OpsCommandItem>
                  <OpsCommandItem value="tenants">Empresas</OpsCommandItem>
                </OpsCommandGroup>
              </OpsCommandList>
            </OpsCommand>
          </div>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel data-testid="ops-ds-matrix-overlays">
        <OpsPanelHeader>
          <OpsPanelTitle>Overlays & feedback</OpsPanelTitle>
          <OpsPanelDescription>
            Sheet/Dialog con footer · Alert notice (dismiss) + warn + danger.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <OpsButton variant="ghost" onClick={() => setSheetOpen(true)}>
              Abrir sheet
            </OpsButton>
            <OpsButton variant="ghost" onClick={() => setDialogOpen(true)}>
              Abrir dialog
            </OpsButton>
            {!noticeOpen ? (
              <OpsButton
                variant="outline"
                size="sm"
                onClick={() => setNoticeOpen(true)}
              >
                Mostrar notice
              </OpsButton>
            ) : null}
          </div>
          {noticeOpen ? (
            <OpsAlert
              tone="notice"
              title="Aviso de consola"
              onDismiss={() => setNoticeOpen(false)}
            >
              Banner notice con icono + dismiss (oficio info GH × acero).
            </OpsAlert>
          ) : null}
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
              Elevated (<code>--ops-bg-elevated</code>) · footer de acciones ·
              radio 3.
            </OpsSheetDescription>
          </OpsSheetHeader>
          <p className="ops-type-body ops-text-muted">
            Stub de catálogo · craft A · F3.
          </p>
          <OpsSheetFooter>
            <OpsButton variant="ghost" onClick={() => setSheetOpen(false)}>
              Cancelar
            </OpsButton>
            <OpsButton variant="solid" onClick={() => setSheetOpen(false)}>
              Guardar
            </OpsButton>
          </OpsSheetFooter>
        </OpsSheetContent>
      </OpsSheet>

      <OpsDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <OpsDialogContent>
          <OpsDialogHeader>
            <OpsDialogTitle>Dialog Ops</OpsDialogTitle>
            <OpsDialogDescription>
              Confirmaciones tipadas usan tono danger · footer alineado.
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
