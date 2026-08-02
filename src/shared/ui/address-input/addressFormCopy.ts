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
      "Esta dirección se usará como domicilio fiscal del cliente en facturación y operación.",
  },
  additional: {
    locationNamePlaceholder: "Ej: Bodega principal, Sucursal norte",
    globalInfoMessage:
      "Registra una ubicación adicional del cliente para entregas, recolecciones o referencia operativa.",
  },
  companyFiscal: {
    locationNamePlaceholder: "Ej: Matriz fiscal, Oficinas centrales",
    globalInfoMessage:
      "Domicilio de tu empresa. Se usa en facturación y en la operación diaria.",
  },
  employeePersonal: {
    locationNamePlaceholder: "",
    globalInfoMessage:
      "Domicilio personal del empleado. País, estado y código postal son obligatorios; municipio, calle y número son opcionales.",
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
