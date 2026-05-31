import type { EmployeeDriverRole } from "../../domain/entities";
import { DRIVER_STATUS_LABELS, type DriverStatusType } from "@features/drivers/domain";

export interface EmployeeDriverRoleAlertContent {
  severity: "warning" | "info";
  title: string;
  items: { text: string }[];
}

function driverStatusLabel(status: string): string {
  return (
    DRIVER_STATUS_LABELS[status as DriverStatusType] ??
    status.replaceAll("_", " ")
  );
}

/**
 * Copy para DetailAlertCard cuando el empleado tiene rol de conductor activo.
 */
export function buildEmployeeDriverRoleAlert(
  driverRole: EmployeeDriverRole,
): EmployeeDriverRoleAlertContent {
  const statusLabel = driverStatusLabel(driverRole.driverStatus);
  const items: { text: string }[] = [
    {
      text: `Estado operativo del conductor: ${statusLabel}.`,
    },
  ];

  if (driverRole.activeTripCount > 0) {
    const codes =
      driverRole.activeTripCodes.length > 0
        ? ` (${driverRole.activeTripCodes.slice(0, 5).join(", ")}${driverRole.activeTripCodes.length > 5 ? ", …" : ""})`
        : "";
    items.push({
      text: `Tiene ${driverRole.activeTripCount} viaje${driverRole.activeTripCount === 1 ? "" : "s"} activo${driverRole.activeTripCount === 1 ? "" : "s"} como conductor${codes}.`,
    });
  }

  if (driverRole.blocksEmployeeTermination) {
    if (driverRole.driverStatus === "on_trip") {
      items.push({
        text: "No podrá darse de baja como empleado hasta finalizar o cancelar el viaje en curso, o actualizar el estado en Conductores.",
      });
    } else {
      items.push({
        text: "No podrá darse de baja como empleado hasta completar o cancelar esos viajes.",
      });
    }

    return {
      severity: "warning",
      title: "Conductor con operación pendiente",
      items,
    };
  }

  items.push({
    text: "Al dar de baja al empleado, el rol de conductor se desactivará automáticamente si no hay viajes activos ni está en viaje.",
  });

  return {
    severity: "info",
    title: "Registrado como conductor activo",
    items,
  };
}
