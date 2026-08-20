export type AddressFormUiContext =
  | "billingOnCreate"
  | "additional"
  | "companyFiscal"
  | "employeePersonal"
  | "tripStop"
  | "branchOperational";

export interface AddressFormCopy {
  locationNamePlaceholder: string;
  globalInfoMessage: string;
}

export const ADDRESS_FORM_COPY: Record<AddressFormUiContext, AddressFormCopy> = {
  billingOnCreate: {
    locationNamePlaceholder: "Ej: Oficina fiscal, Matriz administrativa",
    globalInfoMessage:
      "Domicilio fiscal del receptor para facturar. El código postal basta para el alta; bodegas y puntos de viaje se capturan después en Direcciones.",
  },
  additional: {
    locationNamePlaceholder: "Ej: Bodega principal, Sucursal norte",
    globalInfoMessage:
      "Registra una ubicación adicional del cliente para entregas, recolecciones o referencia operativa.",
  },
  companyFiscal: {
    locationNamePlaceholder: "Ej: Matriz fiscal, Oficinas centrales",
    globalInfoMessage:
      "Domicilio de representación de tu empresa en facturas. El código postal para timbrar se define en el lugar de expedición.",
  },
  employeePersonal: {
    locationNamePlaceholder: "",
    globalInfoMessage:
      "Domicilio personal opcional de RRHH. No se usa en viajes ni en Carta Porte.",
  },
  tripStop: {
    locationNamePlaceholder: "Ej: Bodega Central, CEDIS Norte, Planta Monterrey",
    globalInfoMessage:
      "Ubicación de la parada. País, estado y código postal son obligatorios; ubica el punto en el mapa antes de guardar.",
  },
  branchOperational: {
    locationNamePlaceholder: "Ej: Sucursal Monterrey Centro",
    globalInfoMessage:
      "Domicilio operativo de la sucursal. País, estado, código postal, calle y número exterior son obligatorios; municipio y colonia son opcionales. La ubicación en mapa es opcional.",
  },
};
