/**
 * AppShellSection
 *
 * Documentación viva del app shell (chrome global):
 *   - LayoutShell, sidebar, header, providers
 *   - Toast vs Alert vs notificaciones
 *   - Dimensiones y tokens sidebar
 */

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";

function AppShellMockup() {
  return (
    <div
      className="overflow-hidden rounded-lg border bg-background text-xs"
      aria-hidden
    >
      <div className="flex h-48">
        {/* Sidebar */}
        <div className="flex w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground sm:w-20">
          <div className="flex h-10 items-center justify-center border-b border-sidebar-border">
            <div className="h-3 w-3 rounded-sm bg-sidebar-primary" />
          </div>
          <div className="flex flex-1 flex-col gap-1 p-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-6 rounded-md ${i === 0 ? "bg-sidebar-accent" : "bg-sidebar-accent/40"}`}
              />
            ))}
          </div>
        </div>

        {/* Main + header */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 items-center justify-between border-b bg-background/95 px-2">
            <div className="h-5 w-20 rounded border bg-muted/50" />
            <div className="flex gap-1">
              <div className="h-5 w-5 rounded bg-muted/60" />
              <div className="h-5 w-5 rounded bg-muted/60" />
              <div className="h-5 w-6 rounded-full bg-primary/80" />
            </div>
          </div>
          <div className="flex-1 bg-muted/20 p-2">
            <div className="mx-auto max-w-[90%] space-y-1.5">
              <div className="h-4 w-1/2 rounded bg-foreground/10" />
              <div className="h-3 w-1/3 rounded bg-muted-foreground/20" />
              <div className="mt-2 h-16 rounded-md border bg-card" />
            </div>
          </div>
        </div>
      </div>
      <p className="border-t bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
        Sidebar 70px colapsado (260px expandido) · Header h-16 · Outlet con page
        shell
      </p>
    </div>
  );
}

const GLOBAL_PROVIDERS = [
  "QueryProvider",
  "ThemeProvider",
  "ToastProvider",
  "RouterProvider",
] as const;

const SHELL_PROVIDERS = [
  "AuthProvider",
  "ProductOnboardingGate",
  "PermissionProvider",
  "TooltipProvider",
  "SidebarProvider",
  "LayoutShell",
] as const;

const FEEDBACK_MATRIX = [
  {
    mechanism: "Toast",
    when: "Éxito/error efímero tras mutación o API",
    api: "toastSuccess, toastError (@shared/hooks/useToast)",
  },
  {
    mechanism: "Alert",
    when: "Advertencia o info persistente en la pantalla",
    api: "@shared/ui/alert",
  },
  {
    mechanism: "Badge sidebar",
    when: "Contador operativo (p. ej. aprobaciones)",
    api: "useNavigationWithBadges",
  },
  {
    mechanism: "Notificaciones (header)",
    when: "Inbox in-app cross-módulo",
    api: "GET /notifications, useUnreadNotificationsCount",
  },
] as const;

export function AppShellSection() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>App Shell — chrome global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Marco fijo alrededor del contenido. Las features renderizan dentro del{" "}
            <code className="font-mono text-xs">&lt;Outlet /&gt;</code> usando page
            shells — no reimplementar layout de sidebar/header en módulos.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <AppShellMockup />
            <div className="space-y-3 text-sm">
              <p>
                <Badge variant="info" tone="soft" className="mr-2">
                  Capa 1
                </Badge>
                App shell —{" "}
                <code className="font-mono text-xs">src/widgets/</code>
              </p>
              <p>
                <Badge variant="neutral" tone="soft" className="mr-2">
                  Capa 2
                </Badge>
                Page shells —{" "}
                <code className="font-mono text-xs">@shared/ui/page-shells</code>
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Sidebar: 260px / 70px colapsado (lg+)</li>
                <li>Header fijo: h-16, offset según sidebar</li>
                <li>Main: pt-20, max-w-7xl, padding responsive</li>
                <li>Tokens sidebar: bg-sidebar, border-sidebar-border</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stack de providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Globales en{" "}
              <code className="font-mono text-xs">App.tsx</code> (todas las rutas,
              incl. auth y landing):
            </p>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {GLOBAL_PROVIDERS.map((name, i) => (
                <li
                  key={name}
                  className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {i + 1}.
                  </span>
                  <code className="font-mono text-xs">{name}</code>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Shell autenticado en{" "}
              <code className="font-mono text-xs">AppLayout.tsx</code> (exterior →
              interior):
            </p>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SHELL_PROVIDERS.map((name, i) => (
                <li
                  key={name}
                  className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {i + 1}.
                  </span>
                  <code className="font-mono text-xs">{name}</code>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Header — zonas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Izquierda</p>
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                <li>Menú móvil (&lt; lg)</li>
                <li>Navegación rápida ⌘K (md+)</li>
                <li>Misma data filtrada que el sidebar</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Derecha</p>
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                <li>Notificaciones (placeholder)</li>
                <li>Toggle tema</li>
                <li>Menú usuario (tenant, perfil, logout)</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Regla:</strong> el título{" "}
            <code className="font-mono">text-2xl</code> de cada pantalla vive en
            el page shell, no en el header global.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback — toast vs alert vs badge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Mecanismo</th>
                  <th className="pb-2 pr-4 font-medium">Cuándo</th>
                  <th className="pb-2 font-medium">API</th>
                </tr>
              </thead>
              <tbody>
                {FEEDBACK_MATRIX.map((row) => (
                  <tr key={row.mechanism} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.mechanism}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {row.when}
                    </td>
                    <td className="py-2">
                      <code className="font-mono text-xs">{row.api}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archivos de referencia</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 font-mono text-xs text-muted-foreground">
            <li>src/widgets/layout/ui/AppLayout.tsx</li>
            <li>src/widgets/layout/ui/LayoutShell.tsx</li>
            <li>src/widgets/sidebar/model/navigation.ts</li>
            <li>src/widgets/header/ui/Header.tsx</li>
            <li>src/app/providers/SidebarProvider.tsx</li>
            <li>src/app/providers/ToastProvider.tsx</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Doc extendida:{" "}
            <code className="font-mono">
              docs/design-system/app-shell.md
            </code>{" "}
            (repo erp-transport)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
