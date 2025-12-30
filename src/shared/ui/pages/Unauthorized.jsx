// src/shared/ui/pages/Unauthorized.jsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useAuth } from "@/app/providers/AuthProvider";

/**
 * Unauthorized - Página 403
 * Se muestra cuando el usuario no tiene permisos para acceder a una ruta
 */
export const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">

      <Button onClick={() => navigate("/")}>Ir al Inicio</Button>
      
      {/* <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center space-y-2">
            <div className="rounded-full bg-destructive/10 p-3">
              <svg
                className="h-12 w-12 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            No tienes permisos para acceder a esta página.
          </p>

          {user && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Usuario:</span> {user.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Rol:</span> {user.role}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate(-1)} variant="outline">
              Volver Atrás
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Ir al Dashboard
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Si crees que esto es un error, contacta al administrador.
          </p>
        </CardContent>
      </Card> */}
    </div>
  );
};
