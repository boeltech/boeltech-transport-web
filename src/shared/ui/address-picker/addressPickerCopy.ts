export const ADDRESS_PICKER_COPY = {
  placeholder: "Buscar por nombre, calle o código postal…",
  emptyBrowse:
    "No hay lugares reutilizables en este catálogo. Un administrador puede capturar bodegas o puntos de carga del cliente.",
  emptyResults: "No se encontraron lugares reutilizables",
  loading: "Cargando direcciones…",
  filtering: "Filtrando…",
  loadMore: "Cargar más resultados",
  domicilioCpReady: "Domicilio CP",
  remitenteRfcReady: "RFC",
  remitenteRfcMissing: "Sin RFC",
  remitenteRfcMissingTitle:
    "El domicilio cumple SAT; falta RFC remitente/destinatario para timbrar paradas.",
  geolocated: "Con ubicación en mapa",
  groups: {
    client: "Cliente",
    branch: "Sucursal",
    tenant: "Directorio",
  } as const,
  aria: {
    combobox: "Seleccionar dirección para precargar",
    clear: "Quitar selección",
  },
} as const;
