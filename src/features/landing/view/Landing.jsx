import { useState } from "react";
import { Can } from "@shared/ui/Can";
import { usePermissions } from "@app/providers/PermissionsProvider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export const Landing = () => {
  const { can, isAdmin } = usePermissions();
  const [time, setTime] = useState();

  function updateTime() {
    const current = new Date().toLocaleTimeString();
    setTime(current);
  }

  setInterval(updateTime, 1000);

  return (
    <div className="page-container">
      <h1 className="page-title">Prueba de Tailwind + shadcn/ui</h1>
      
      <div className="grid-cards">
        <Card>
          <CardHeader>
            <CardTitle>Tarjeta de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <h1>Hora Actual: {time}</h1>

            <p className="text-muted-foreground">
              Si ves esta tarjeta con estilos, ¡la configuración funciona!
            </p>
            <Button className="mt-4">Botón de Prueba</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
