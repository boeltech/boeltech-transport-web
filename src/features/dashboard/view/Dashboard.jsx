// src/features/dashboard/view/Dashboard.jsx

import { useAuth } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/providers/PermissionsProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';

export const Dashboard = () => {
  const { user } = useAuth();
  const { can, getUserPermissions } = usePermissions();

  const userPermissions = getUserPermissions();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          ¡Bienvenido, {user?.name}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Este es tu dashboard del ERP de Transporte
        </p>
      </div>

      {/* User Info Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nombre
              </p>
              <p className="text-lg">{user?.name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Email
              </p>
              <p className="text-lg">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Rol
              </p>
              <p className="text-lg capitalize">{user?.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Permisos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Vehículos</span>
                <span className="text-xs">
                  {can('vehicles.read') ? '✅ Leer' : '❌'}
                  {can('vehicles.create') ? ' ✅ Crear' : ''}
                  {can('vehicles.update') ? ' ✅ Editar' : ''}
                  {can('vehicles.delete') ? ' ✅ Eliminar' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Viajes</span>
                <span className="text-xs">
                  {can('trips.read') ? '✅ Leer' : '❌'}
                  {can('trips.create') ? ' ✅ Crear' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Facturas</span>
                <span className="text-xs">
                  {can('invoices.read') ? '✅ Leer' : '❌'}
                  {can('invoices.create') ? ' ✅ Crear' : ''}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Total de permisos: {userPermissions.length}
                  {userPermissions.includes('*') && ' (Acceso Total)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✅ Activo</div>
            <p className="text-xs text-muted-foreground mt-1">
              Autenticación funcionando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              RBAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✅ Activo</div>
            <p className="text-xs text-muted-foreground mt-1">
              Permisos configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rol Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user?.role}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {userPermissions.length} permisos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas de Autenticación ✅</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-medium text-green-900 mb-2">
              ✅ Sistema de Autenticación Funcionando
            </h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Login exitoso</li>
              <li>• Usuario cargado: {user?.name}</li>
              <li>• Token JWT almacenado</li>
              <li>• Permisos RBAC activos</li>
              <li>• Navegación protegida activa</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              📋 Siguiente Paso
            </h4>
            <p className="text-sm text-blue-800">
              Probar cerrar sesión y volver a iniciar con diferentes roles para
              verificar que los permisos cambien correctamente.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Permisos Disponibles:</p>
            <div className="flex flex-wrap gap-2">
              {userPermissions.slice(0, 10).map((permission, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                >
                  {permission}
                </span>
              ))}
              {userPermissions.length > 10 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
                  +{userPermissions.length - 10} más
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};