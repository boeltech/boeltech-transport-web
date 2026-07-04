export const ADDRESS_PICKER_COPY = {
  placeholder: "Buscar dirección guardada…",
  searchHint: "Escribe al menos 2 caracteres para buscar",
  emptyResults: "No se encontraron direcciones",
  loading: "Buscando direcciones…",
  loadMore: "Cargar más resultados",
  domicilioCpReady: "Domicilio CP",
  remitenteRfcReady: "RFC",
  remitenteRfcMissing: "Sin RFC",
  remitenteRfcMissingTitle:
    "El domicilio cumple SAT; falta RFC remitente/destinatario para timbrar paradas.",
  geolocated: "Con ubicación en mapa",
  groups: {
    client: "Cliente",
    tenant: "Directorio",
  } as const,
  aria: {
    combobox: "Seleccionar dirección para precargar",
    clear: "Quitar selección",
  },
} as const;
