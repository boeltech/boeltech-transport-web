/** Copy mínimo del canvas de alta (ADR-0078). Namespace: trips.copy.canvas.* */
export const canvasCopy = {
  page: {
    title: "Reservar viaje",
    subtitle: "Anota el pedido del cliente y deja unidad y conductor listos.",
    backLabel: "Volver a viajes",
  },
  columns: {
    pedido: "Pedido",
    flota: "Flota",
    pedidoHint: "Cliente, corredor o ciudades y fecha de salida.",
    flotaHint: "Unidad, remolque si aplica y conductor.",
  },
  confirmLater: {
    title: "Completar al confirmar",
    hint: "Llegada, tarifa y kilometraje se pueden capturar después.",
  },
  corridor: {
    label: "Corredor frecuente",
    hint: "Clona las paradas. No copia flota, fecha, mercancía ni tarifa.",
    empty: "Sin corredores previos; captura ciudades.",
    loading: "Cargando corredores…",
    stopCount: (count: number) =>
      `${count} parada${count === 1 ? "" : "s"}`,
    tripCount: (count: number) =>
      `${count} viaje${count === 1 ? "" : "s"}`,
  },
  estimate: {
    title: "Estimado interno",
    fuel: "Combustible",
    tolls: "Peaje",
    total: "Total",
    basedOn: (n: number) =>
      `Con base en ${n} viaje${n === 1 ? "" : "s"} completados`,
    adjusted: "Ajustado al rendimiento de la unidad",
    distance: (km: number) => `${km} km`,
    compactLine: (total: string) =>
      `${total}. No es precio al cliente. No bloquea reservar.`,
    disclaimer:
      "Estimado interno de combustible y peaje. No es precio al cliente ni cotización. Percances no incluidos.",
    doesNotBlock: "No bloquea reservar.",
  },
  submit: {
    label: "Reservar viaje",
    pending: "Guardando reserva…",
    validationTitle: "Revisa el pedido y la flota",
  },
} as const;
