/**
 * PatternsSection (Fase 3)
 *
 * Documentación viva de los patrones de pantalla del ERP:
 *   - Page shells (List, Detail, Form, Wizard, Settings)
 *   - Jerarquía tipográfica por shell
 *   - Spacing scale
 *   - Patrón detail-sheet-master-detail (skill canónico)
 *
 * Cada shell se ilustra con un mockup SVG/HTML simplificado + tabla
 * "cuándo usarlo" + ejemplo de import.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";

interface ShellSpec {
  name: string;
  description: string;
  whenToUse: string;
  example: string;
  import: string;
}

const SHELLS: readonly ShellSpec[] = [
  {
    name: "ListPageShell",
    description:
      "Header + toolbar (search/filtros/acciones/refresh/viewMode) + results summary + tabla o grid de cards + paginación + empty state",
    whenToUse:
      "Páginas de listado: vehículos, conductores, clientes, viajes, empleados, facturas.",
    example:
      "features/vehicles/presentation/pages/VehicleListPage.tsx",
    import: 'import { ListPageShell } from "@shared/ui/page-shells";',
  },
  {
    name: "DetailPageShell",
    description:
      "Header (back, icono, título, status, acciones) + alerts + pre-stats + stats + tabs + content + metadata footer",
    whenToUse:
      "Detalle de entidad. Combina con Sheet contextual + master-detail para sub-recursos (skill detail-sheet-master-detail).",
    example: "features/clients/presentation/pages/ClientDetailPage.tsx",
    import: 'import { DetailPageShell } from "@shared/ui/page-shells";',
  },
  {
    name: "FormPageShell",
    description:
      "Header + loading/notFound states + form sections + actions bar (cancel + submit)",
    whenToUse:
      "Edición simple (no por pasos). Para creación, prefiere WizardPageShell.",
    example: "features/employees/presentation/pages/EmployeeFormPage.tsx",
    import: 'import { FormPageShell } from "@shared/ui/page-shells";',
  },
  {
    name: "WizardPageShell",
    description:
      "Header + WizardSteps + content por paso + nav (anterior/siguiente/revisar/submit). Validación por paso con triggerStepValidation",
    whenToUse:
      "Creación o flows multi-paso. Patrón canónico: viajes (Paso 1/Paso 2/Cargo/Costos/Resumen).",
    example: "features/trips/presentation/pages/create/TripFormPage.tsx",
    import: 'import { WizardPageShell } from "@shared/ui/page-shells";',
  },
  {
    name: "SettingsPageShell",
    description:
      "Wrapper sobre SettingsLayout — sidebar de settings + content area",
    whenToUse:
      "Páginas de configuración: company settings, billing, notifications, integrations, security.",
    example: "features/settings/presentation/pages/GeneralSettingsPage.tsx",
    import: 'import { SettingsPageShell } from "@shared/ui/page-shells";',
  },
] as const;

export function PatternsSection() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Page Shells</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esqueletos estándar que estandarizan el layout de cada tipo de
            pantalla. Las features no implementan layouts ad-hoc — todas
            consumen un shell de <code>@shared/ui/page-shells</code>.
          </p>
        </CardContent>
      </Card>

      {/* Visual mockups */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ShellMockup
          title="ListPageShell"
          render={<ListMockup />}
        />
        <ShellMockup
          title="DetailPageShell"
          render={<DetailMockup />}
        />
        <ShellMockup
          title="FormPageShell"
          render={<FormMockup />}
        />
        <ShellMockup
          title="WizardPageShell"
          render={<WizardMockup />}
        />
      </div>

      {/* Detailed spec table */}
      <Card>
        <CardHeader>
          <CardTitle>Especificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {SHELLS.map((shell) => (
            <div
              key={shell.name}
              className="space-y-2 border-l-2 border-primary pl-4"
            >
              <div className="flex items-baseline gap-3">
                <h3 className="text-base font-semibold">{shell.name}</h3>
                <Badge variant="info" tone="soft">
                  Shell
                </Badge>
              </div>
              <p className="text-sm">{shell.description}</p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Cuándo:</strong>{" "}
                {shell.whenToUse}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Ejemplo:</strong>{" "}
                <code className="font-mono">{shell.example}</code>
              </p>
              <pre className="overflow-x-auto rounded-md bg-muted/40 px-3 py-2 text-xs">
                <code className="font-mono">{shell.import}</code>
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Typography hierarchy per shell */}
      <Card>
        <CardHeader>
          <CardTitle>Jerarquía tipográfica por shell</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Rol</th>
                  <th className="pb-2 pr-4">Token</th>
                  <th className="pb-2 pr-4">Peso</th>
                  <th className="pb-2">Uso</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-medium">Page title (h1)</td>
                  <td className="py-2 pr-4 font-mono text-xs">text-2xl</td>
                  <td className="py-2 pr-4 font-mono text-xs">font-bold</td>
                  <td className="py-2 text-muted-foreground">
                    Header de cada shell (List/Detail/Form/Wizard)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Section title (h2)</td>
                  <td className="py-2 pr-4 font-mono text-xs">text-lg</td>
                  <td className="py-2 pr-4 font-mono text-xs">font-semibold</td>
                  <td className="py-2 text-muted-foreground">
                    FormSectionCard, DetailSection
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Card title (h3)</td>
                  <td className="py-2 pr-4 font-mono text-xs">text-base</td>
                  <td className="py-2 pr-4 font-mono text-xs">font-semibold</td>
                  <td className="py-2 text-muted-foreground">CardTitle</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Body</td>
                  <td className="py-2 pr-4 font-mono text-xs">text-sm</td>
                  <td className="py-2 pr-4 font-mono text-xs">font-normal</td>
                  <td className="py-2 text-muted-foreground">
                    Contenido general, labels secundarios
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Description</td>
                  <td className="py-2 pr-4 font-mono text-xs">text-sm</td>
                  <td className="py-2 pr-4 font-mono text-xs">font-normal</td>
                  <td className="py-2 text-muted-foreground">
                    text-muted-foreground bajo titulos
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Caption / metadata</td>
                  <td className="py-2 pr-4 font-mono text-xs">text-xs</td>
                  <td className="py-2 pr-4 font-mono text-xs">font-medium</td>
                  <td className="py-2 text-muted-foreground">
                    Labels uppercase, fechas, IDs
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Data tabular</td>
                  <td className="py-2 pr-4 font-mono text-xs">text-sm</td>
                  <td className="py-2 pr-4 font-mono text-xs">font-mono</td>
                  <td className="py-2 text-muted-foreground">
                    RFC, UUID, totales, claves SAT (tabular-nums automático)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Spacing */}
      <Card>
        <CardHeader>
          <CardTitle>Spacing scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Basada en la escala default de Tailwind (4px base). Reglas de
            aplicación por contexto:
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Page-level:</strong>{" "}
              <code className="font-mono text-xs">space-y-6</code> entre
              header, toolbar, content y pagination.
            </li>
            <li>
              <strong>Card-level:</strong>{" "}
              <code className="font-mono text-xs">space-y-4</code> entre
              CardHeader y CardContent. <code className="font-mono text-xs">p-6</code>{" "}
              padding interno default.
            </li>
            <li>
              <strong>Form-level:</strong>{" "}
              <code className="font-mono text-xs">space-y-1.5</code> entre
              Label e Input. <code className="font-mono text-xs">space-y-4</code>{" "}
              entre form fields.
            </li>
            <li>
              <strong>Inline / chips:</strong>{" "}
              <code className="font-mono text-xs">gap-2</code>{" "}
              en grupos de botones o badges.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Master-detail pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Patrón canónico — detail-sheet-master-detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cuando una entidad tiene <strong>edición del padre</strong> y{" "}
            <strong>sub-recursos con CRUD propio</strong>, no usar un form
            full-page para todo. Skill canónico:{" "}
            <code className="font-mono text-xs">
              .agents/skills/detail-sheet-master-detail
            </code>
            .
          </p>
          <div className="rounded-md border bg-muted/20 p-4">
            <MasterDetailMockup />
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Padre:</strong> editable en un{" "}
              <code className="font-mono text-xs">Sheet</code> contextual desde
              el header del detalle. Un único PUT/PATCH al cerrar con Guardar.
            </p>
            <p>
              <strong>Hijos:</strong> en tab con layout master-detail (lista a
              la izquierda, panel a la derecha). Cada operación
              (POST/PUT/DELETE) se guarda al confirmar — sin "Guardar todo"
              global.
            </p>
            <p>
              <strong>Selección sin efectos:</strong> usar IDs derivados con{" "}
              <code className="font-mono text-xs">useMemo</code>{" "}
              (no <code className="font-mono text-xs">useEffect + setState</code>
              {" "}para cumplir reglas como{" "}
              <code className="font-mono text-xs">react-hooks/set-state-in-effect</code>
              ).
            </p>
            <p>
              <strong>Referencia:</strong>{" "}
              <code className="font-mono text-xs">
                features/clients/presentation/pages/ClientDetailPage.tsx
              </code>
              {" "}+{" "}
              <code className="font-mono text-xs">
                features/clients/presentation/components/ClientAddressMasterDetail.tsx
              </code>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===========================================================================
//  Mockup helpers — visualizaciones simplificadas de cada shell
// ===========================================================================

interface ShellMockupProps {
  title: string;
  render: React.ReactNode;
}

function ShellMockup({ title, render }: ShellMockupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-muted/20 p-3">{render}</div>
      </CardContent>
    </Card>
  );
}

function MockBar({
  className = "",
  width = "100%",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div
      className={`h-2 rounded bg-muted ${className}`}
      style={{ width }}
    />
  );
}

function ListMockup() {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <MockBar width="40%" className="h-3" />
        <div className="h-6 w-20 rounded bg-primary/30" />
      </div>
      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="h-7 flex-1 rounded bg-muted" />
        <div className="h-7 w-20 rounded bg-muted" />
        <div className="h-7 w-7 rounded bg-muted" />
      </div>
      {/* Table rows */}
      <div className="space-y-1.5 pt-1">
        {[80, 65, 90, 70, 85].map((w, i) => (
          <div key={i} className="flex items-center gap-2 rounded bg-card p-2">
            <div className="h-6 w-6 rounded bg-muted" />
            <MockBar width={`${w}%`} />
            <div className="h-4 w-12 rounded-full bg-info-soft" />
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-center gap-1 pt-1">
        <div className="h-5 w-5 rounded bg-muted" />
        <div className="h-5 w-5 rounded bg-primary/30" />
        <div className="h-5 w-5 rounded bg-muted" />
      </div>
    </div>
  );
}

function DetailMockup() {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-muted" />
        <MockBar width="50%" className="h-3" />
        <div className="ml-auto h-5 w-16 rounded-full bg-success-soft" />
      </div>
      {/* Pre-stats */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded bg-card p-2">
            <MockBar width="60%" className="mb-1 h-1.5" />
            <MockBar width="40%" className="h-3" />
          </div>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex gap-3 border-b pb-1 pt-2">
        <MockBar width="50px" className="h-2 bg-primary" />
        <MockBar width="60px" className="h-2" />
        <MockBar width="55px" className="h-2" />
      </div>
      {/* Content */}
      <div className="space-y-1.5 pt-1">
        <MockBar width="100%" />
        <MockBar width="80%" />
        <MockBar width="90%" />
      </div>
    </div>
  );
}

function FormMockup() {
  return (
    <div className="space-y-2">
      <MockBar width="40%" className="h-3" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded bg-card p-2.5">
          <MockBar width="30%" className="mb-2 h-2" />
          <div className="space-y-1.5">
            <div className="h-6 rounded bg-muted" />
            <div className="h-6 rounded bg-muted" />
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <div className="h-7 w-20 rounded bg-muted" />
        <div className="h-7 w-24 rounded bg-primary/40" />
      </div>
    </div>
  );
}

function WizardMockup() {
  return (
    <div className="space-y-2">
      <MockBar width="40%" className="h-3" />
      {/* Steps */}
      <div className="flex items-center gap-1 pt-1">
        {[true, true, false, false, false].map((active, i) => (
          <div key={i} className="flex flex-1 items-center gap-1">
            <div
              className={`h-5 w-5 rounded-full ${
                active ? "bg-primary" : "bg-muted"
              }`}
            />
            {i < 4 && (
              <div
                className={`h-0.5 flex-1 ${
                  active ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {/* Card */}
      <div className="rounded bg-card p-2.5">
        <MockBar width="40%" className="mb-2 h-2" />
        <div className="space-y-1.5">
          <div className="h-6 rounded bg-muted" />
          <div className="h-6 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
        </div>
      </div>
      {/* Nav */}
      <div className="flex justify-between pt-1">
        <div className="h-7 w-20 rounded bg-muted" />
        <div className="h-7 w-24 rounded bg-primary/40" />
      </div>
    </div>
  );
}

function MasterDetailMockup() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <MockBar width="30%" className="h-3" />
        <div className="h-6 w-24 rounded bg-primary/30" />
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
        {/* Master list */}
        <div className="space-y-1.5">
          {[
            { active: false, w: "75%" },
            { active: true, w: "85%" },
            { active: false, w: "65%" },
            { active: false, w: "70%" },
          ].map((it, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded p-2 ${
                it.active ? "bg-primary/15" : "bg-card"
              }`}
            >
              <div className="h-4 w-4 rounded bg-muted" />
              <MockBar width={it.w} />
            </div>
          ))}
        </div>
        {/* Detail panel */}
        <div className="rounded bg-card p-3">
          <MockBar width="50%" className="mb-2 h-3" />
          <div className="space-y-1.5">
            <MockBar width="100%" />
            <MockBar width="80%" />
            <MockBar width="60%" />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-6 w-20 rounded bg-primary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
