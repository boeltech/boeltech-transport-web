// src/shared/ui/pages/NotFound.jsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';

/**
 * NotFound - Página 404
 * Se muestra cuando la ruta no existe
 */
export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
        
      <Button onClick={() => navigate("/")}>Ir al Inicio</Button>

      {/* <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-6xl font-bold text-primary">404</div>
            <CardTitle className="text-2xl">Página No Encontrada</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            La página que buscas no existe o ha sido movida.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate(-1)} variant="outline">
              Volver Atrás
            </Button>
            <Button onClick={() => navigate('/')}>
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};
