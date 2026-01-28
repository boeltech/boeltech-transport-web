/**
 * DashboardPage
 *
 * Página principal después del login.
 * Muestra un resumen del sistema y confirma que el usuario está autenticado.
 *
 * Ubicación: src/pages/dashboard/DashboardPage.tsx
 */

import {
  Truck,
  Users,
  Route,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { usePermissions } from "@shared/permissions";
import { getUserFullName, getGreeting } from "@/shared/lib/userHelpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

// ============================================
// Main Component
// ============================================

function DashboardPage() {
  const { user, logout } = useAuth();
  const { role, hasPermission } = usePermissions();

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting(user)}
          </h1>
          <p className="text-muted-foreground">
            Este es tu panel de control. Aquí puedes ver un resumen de tu
            operación.
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Cerrar Sesión
        </Button>
      </div>

      {/* Info del usuario autenticado */}
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            Autenticación Exitosa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuario:</span>
              <span className="font-medium">{getUserFullName(user)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rol:</span>
              <span className="font-medium capitalize">{role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empresa:</span>
              <span className="font-medium">{user?.tenant?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subdomain:</span>
              <span className="font-medium">{user?.tenant?.subdomain}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Solo mostrar las que el usuario puede ver */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {hasPermission("vehicles", "read") && (
          <StatCard
            title="Vehículos"
            value="24"
            description="En operación"
            icon={Truck}
            trend="+2 este mes"
          />
        )}
        {hasPermission("drivers", "read") && (
          <StatCard
            title="Conductores"
            value="18"
            description="Activos"
            icon={Users}
            trend="+1 este mes"
          />
        )}
        {hasPermission("trips", "read") && (
          <StatCard
            title="Viajes"
            value="156"
            description="Este mes"
            icon={Route}
            trend="+12% vs anterior"
          />
        )}
        {hasPermission("invoices", "read") && (
          <StatCard
            title="Facturas"
            value="$485,000"
            description="Facturado"
            icon={FileText}
            trend="+8% vs anterior"
          />
        )}
      </div>

      {/* Secciones según permisos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Viajes recientes */}
        {hasPermission("trips", "read") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Viajes Recientes
              </CardTitle>
              <CardDescription>Últimos viajes registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">Viaje #{1000 + i}</p>
                      <p className="text-sm text-muted-foreground">
                        CDMX → Guadalajara
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      Completado
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas */}
        {hasPermission("maintenance", "read") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Alertas
              </CardTitle>
              <CardDescription>Requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AlertItem
                  title="Verificación vencida"
                  description="Vehículo TRK-001 - Vence en 3 días"
                  variant="warning"
                />
                <AlertItem
                  title="Mantenimiento programado"
                  description="Vehículo TRK-005 - Mañana 9:00 AM"
                  variant="info"
                />
                <AlertItem
                  title="Licencia por vencer"
                  description="Conductor Juan Pérez - 15 días"
                  variant="warning"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Auxiliary Components
// ============================================

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="mt-1 flex items-center text-xs text-green-600 dark:text-green-400">
            <TrendingUp className="mr-1 h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  title: string;
  description: string;
  variant: "warning" | "info" | "error";
}

function AlertItem({ title, description, variant }: AlertItemProps) {
  const variants = {
    warning:
      "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
    info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
    error: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
  };

  return (
    <div className={`rounded-lg border p-3 ${variants[variant]}`}>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default DashboardPage;
