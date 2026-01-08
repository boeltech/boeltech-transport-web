// src/shared/ui/layouts/MainLayout.jsx

import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/providers/PermissionsProvider';
import { Button } from '@/shared/ui/button';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { isAdmin, isManager } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">
                ERP Transporte
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate('/vehicles')}
              >
                Vehículos
              </Button>

              {(isAdmin() || isManager()) && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/trips')}
                  >
                    Viajes
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => navigate('/drivers')}
                  >
                    Conductores
                  </Button>
                </>
              )}

              {isAdmin() && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/users')}
                >
                  Usuarios
                </Button>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium">{user?.name || 'Usuario'}</p>
                <p className="text-muted-foreground text-xs capitalize">
                  {user?.role || 'Sin rol'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};