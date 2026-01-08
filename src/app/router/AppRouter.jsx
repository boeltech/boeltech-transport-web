// src/app/router/AppRouter.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';

// Layout
import { MainLayout } from '@/shared/ui/layouts/MainLayout';
import { AuthLayout } from '@/shared/ui/layouts/AuthLayout';

// Rutas protegidas
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// // Páginas públicas
import { Landing } from '@/features/landing/view/Landing';
import { Login } from '@/features/auth/view/Login/Login';
// import { Register } from '@/features/auth/view/Register/Register';
// import { ForgotPassword } from '@/features/auth/view/ForgotPassword/ForgotPassword';
import { Unauthorized } from '@/shared/ui/pages/Unauthorized';
import { NotFound } from '@/shared/ui/pages/NotFound';

// // Dashboard
// import { Dashboard } from '@/features/dashboard/view/Dashboard';

// // Usuarios (Admin only)
// import { UsersList } from '@/features/users/view/UsersList/UsersList';
// import { UserForm } from '@/features/users/view/UserForm/UserForm';
// import { UserDetail } from '@/features/users/view/UserDetail/UserDetail';

// // Vehículos
// import { VehiclesList } from '@/features/vehicles/view/VehiclesList/VehiclesList';
// import { VehicleForm } from '@/features/vehicles/view/VehicleForm/VehicleForm';
// import { VehicleDetail } from '@/features/vehicles/view/VehicleDetail/VehicleDetail';

// // Viajes
// import { TripsList } from '@/features/trips/view/TripsList/TripsList';
// import { TripForm } from '@/features/trips/view/TripForm/TripForm';
// import { TripDetail } from '@/features/trips/view/TripDetail/TripDetail';
// import { TripTracking } from '@/features/trips/view/TripTracking/TripTracking';

// // Conductores
// import { DriversList } from '@/features/drivers/view/DriversList/DriversList';
// import { DriverForm } from '@/features/drivers/view/DriverForm/DriverForm';
// import { DriverDetail } from '@/features/drivers/view/DriverDetail/DriverDetail';

// // Mantenimiento
// import { MaintenanceList } from '@/features/maintenance/view/MaintenanceList/MaintenanceList';
// import { MaintenanceForm } from '@/features/maintenance/view/MaintenanceForm/MaintenanceForm';
// import { MaintenanceDetail } from '@/features/maintenance/view/MaintenanceDetail/MaintenanceDetail';

// // Refacciones
// import { PartsList } from '@/features/parts/view/PartsList/PartsList';
// import { PartForm } from '@/features/parts/view/PartForm/PartForm';

// // Combustible
// import { FuelList } from '@/features/fuel/view/FuelList/FuelList';
// import { FuelForm } from '@/features/fuel/view/FuelForm/FuelForm';

// // Clientes
// import { CustomersList } from '@/features/customers/view/CustomersList/CustomersList';
// import { CustomerForm } from '@/features/customers/view/CustomerForm/CustomerForm';
// import { CustomerDetail } from '@/features/customers/view/CustomerDetail/CustomerDetail';

// // Facturas
// import { InvoicesList } from '@/features/invoices/view/InvoicesList/InvoicesList';
// import { InvoiceForm } from '@/features/invoices/view/InvoiceForm/InvoiceForm';
// import { InvoiceDetail } from '@/features/invoices/view/InvoiceDetail/InvoiceDetail';

// // Gastos
// import { ExpensesList } from '@/features/expenses/view/ExpensesList/ExpensesList';
// import { ExpenseForm } from '@/features/expenses/view/ExpenseForm/ExpenseForm';

// // Reportes
// import { ReportsDashboard } from '@/features/reports/view/ReportsDashboard/ReportsDashboard';
// import { FleetReport } from '@/features/reports/view/FleetReport/FleetReport';
// import { FinancialReport } from '@/features/reports/view/FinancialReport/FinancialReport';
// import { TripsReport } from '@/features/reports/view/TripsReport/TripsReport';

/**
 * AppRouter - Router principal de la aplicación
 * Maneja todas las rutas públicas y protegidas
 */
export const AppRouter = () => {
  const { isLoading } = useAuthContext();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* ==================== RUTAS PÚBLICAS ==================== */}
      
      {/* Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Autenticación */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> */}
      </Route>

      {/* Páginas de error */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ==================== RUTAS PROTEGIDAS ==================== */}
      
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        {/* <Route
          path="/dashboard"
          element={
            <RoleRoute requiredPermission="dashboard.read">
              <Dashboard />
            </RoleRoute>
          }
        /> */}

        {/* ==================== USUARIOS (Admin only) ==================== */}
        {/* <Route path="/users">
          <Route
            index
            element={
              <RoleRoute requiredRole="administrador">
                <UsersList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredRole="administrador">
                <UserForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute requiredRole="administrador">
                <UserDetail />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredRole="administrador">
                <UserForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== VEHÍCULOS ==================== */}
        {/* <Route path="/vehicles">
          <Route
            index
            element={
              <RoleRoute requiredPermission="vehicles.read">
                <VehiclesList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="vehicles.create">
                <VehicleForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute requiredPermission="vehicles.read">
                <VehicleDetail />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="vehicles.update">
                <VehicleForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== VIAJES ==================== */}
        {/* <Route path="/trips">
          <Route
            index
            element={
              <RoleRoute requiredPermission="trips.read">
                <TripsList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="trips.create">
                <TripForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute requiredPermission="trips.read">
                <TripDetail />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="trips.update">
                <TripForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id/tracking"
            element={
              <RoleRoute requiredPermission="trips.read">
                <TripTracking />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== CONDUCTORES ==================== */}
        {/* <Route path="/drivers">
          <Route
            index
            element={
              <RoleRoute requiredPermission="drivers.read">
                <DriversList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="drivers.create">
                <DriverForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute requiredPermission="drivers.read">
                <DriverDetail />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="drivers.update">
                <DriverForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== MANTENIMIENTO ==================== */}
        {/* <Route path="/maintenance">
          <Route
            index
            element={
              <RoleRoute requiredPermission="maintenance.read">
                <MaintenanceList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="maintenance.create">
                <MaintenanceForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute requiredPermission="maintenance.read">
                <MaintenanceDetail />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="maintenance.update">
                <MaintenanceForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== REFACCIONES ==================== */}
        {/* <Route path="/parts">
          <Route
            index
            element={
              <RoleRoute requiredPermission="parts.read">
                <PartsList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="parts.create">
                <PartForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="parts.update">
                <PartForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== COMBUSTIBLE ==================== */}
        {/* <Route path="/fuel">
          <Route
            index
            element={
              <RoleRoute requiredPermission="fuel.read">
                <FuelList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="fuel.create">
                <FuelForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="fuel.update">
                <FuelForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== CLIENTES ==================== */}
        {/* <Route path="/customers">
          <Route
            index
            element={
              <RoleRoute requiredPermission="customers.read">
                <CustomersList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="customers.create">
                <CustomerForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute requiredPermission="customers.read">
                <CustomerDetail />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="customers.update">
                <CustomerForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== FACTURAS ==================== */}
        {/* <Route path="/invoices">
          <Route
            index
            element={
              <RoleRoute requiredPermission="invoices.read">
                <InvoicesList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="invoices.create">
                <InvoiceForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute requiredPermission="invoices.read">
                <InvoiceDetail />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="invoices.update">
                <InvoiceForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== GASTOS ==================== */}
        {/* <Route path="/expenses">
          <Route
            index
            element={
              <RoleRoute requiredPermission="expenses.read">
                <ExpensesList />
              </RoleRoute>
            }
          />
          <Route
            path="new"
            element={
              <RoleRoute requiredPermission="expenses.create">
                <ExpenseForm />
              </RoleRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <RoleRoute requiredPermission="expenses.update">
                <ExpenseForm />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* ==================== REPORTES ==================== */}
        {/* <Route path="/reports">
          <Route
            index
            element={
              <RoleRoute
                requiredPermissions={[
                  'reports.fleet',
                  'reports.financial',
                  'reports.trips',
                ]}
              >
                <ReportsDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="fleet"
            element={
              <RoleRoute requiredPermission="reports.fleet">
                <FleetReport />
              </RoleRoute>
            }
          />
          <Route
            path="financial"
            element={
              <RoleRoute requiredPermission="reports.financial">
                <FinancialReport />
              </RoleRoute>
            }
          />
          <Route
            path="trips"
            element={
              <RoleRoute requiredPermission="reports.trips">
                <TripsReport />
              </RoleRoute>
            }
          />
        </Route> */}

        {/* Redirigir /app a /dashboard */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* ==================== 404 - NOT FOUND ==================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};