/**
 * Spanish copy for Location DS family (ADR-0092).
 * Sentence case; no jerga interna (SAT/API/confianza/proveedores).
 */

export const LOCATION_FIELD_COPY = {
  searchPlaceholder: "Buscar ubicación…",
  /** Create-only contexts (no catalog reuse). */
  searchPlaceholderCreateOnly: "Mapa o crear nueva…",
  searchEmpty: "Sin resultados. Prueba otro término o crea una nueva.",
  searchIdle: "Escribe para buscar en el catálogo o en el mapa.",
  searchIdleCreateOnly: "Escribe para buscar en el mapa.",
  searchLoading: "Buscando…",
  searchError: "No se pudo completar la búsqueda. Intenta de nuevo.",
  searchPartialError:
    "Parte de la búsqueda no respondió. Revisa el catálogo o el mapa.",
  searchPartialErrorCreateOnly:
    "Parte de la búsqueda no respondió. Revisa el mapa.",
  createNew: "Crear ubicación nueva",
  createNewLowConfidence: "Crear y fijar en el mapa",
  lowConfidenceBanner:
    "El mapa no encontró un resultado claro para esta dirección. Puedes crear una nueva y ajustar el pin, o revisar las sugerencias.",
  lowConfidenceCreateHint:
    "Recomendado: crea la ubicación y confirma el punto en el mapa.",
  lowConfidenceSheetHint:
    "Confirma el código postal y mueve el pin en el mapa si hace falta.",
  groupInternal: "Catálogo",
  groupMapbox: "Mapa",
  groupCreate: "Nueva",
  groupCreateRecommended: "Recomendado",
  change: "Cambiar",
  changeAriaLabel: "Cambiar ubicación",
  edit: "Editar",
  editAriaLabel: "Editar datos de la ubicación",
  save: "Usar",
  cancel: "Cancelar",
  sheetTitle: "Confirmar ubicación",
  sheetDescription:
    "Revisa el nombre, la dirección y el punto en el mapa.",
  nameLabel: "Nombre",
  namePlaceholder: "Ej. Bodega Norte, CEDIS, Cliente…",
  postalCodeLabel: "Código postal",
  postalCodePlaceholder: "5 dígitos",
  streetLabel: "Calle",
  exteriorNumberLabel: "Núm. exterior",
  searchLabel: "Buscar ubicación",
  mapSection: "Punto en el mapa",
  cartaPorteReady: "Lista para Carta Porte",
  cartaPorteNotReady: "Faltan datos para Carta Porte",
  /** Readiness chip when `context="fiscal"` (emisor / facturación; no es Ubicación CP). */
  fiscalReady: "Listo para facturas",
  fiscalNotReady: "Faltan datos para facturas",
  noCoordinates: "Sin punto en el mapa",
  emptyHint: "Busca en el catálogo o en el mapa, o crea una nueva.",
  emptyHintCreateOnly: "Busca en el mapa o crea una nueva.",
  satDetailTitle: "Afinar domicilio",
  satDetailHint:
    "Completa o corrige calle y colonia si hace falta. No sustituye la búsqueda de arriba.",
  sourceInternal: "Catálogo",
  sourceMapbox: "Mapa",
  sourceCreate: "Nueva",
  resolvingSat: "Buscando colonia y municipio…",
  resolvedNeighborhood: "Colonia",
  ambiguityHint:
    "Hay más de una colonia o municipio posibles. Tras Usar, elige la correcta en «Completar domicilio».",
  tripStopUseHint:
    "Para usarla en la ruta: nombre, código postal y punto en el mapa.",
  duplicateWarningTitle: "Parece que esta ubicación ya existe",
  duplicateWarningBody:
    "Puedes continuar o elegir la que ya está registrada. No bloquea el guardado.",
  postalCodeShort: "Código postal",
  coordinatesLabel: "Coordenadas",
  neighborhoodLabel: "Colonia",
  changeSearchPlaceholder: "Buscar otra ubicación…",
} as const;
