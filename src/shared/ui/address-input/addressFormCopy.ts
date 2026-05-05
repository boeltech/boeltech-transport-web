export type AddressFormUiContext = "billingOnCreate" | "additional";

export interface AddressFormCopy {
  locationNamePlaceholder: string;
  globalInfoMessage: string;
  cartaPorteDescription: string;
  fiscalDataDescription: string;
  fiscalRfcHint: string;
}

export const ADDRESS_FORM_COPY: Record<AddressFormUiContext, AddressFormCopy> = {
  billingOnCreate: {
    locationNamePlaceholder: "Ej: Oficina Fiscal, Matriz Administrativa",
    globalInfoMessage: "Esta direccion se usara para CFDI y Carta Porte.",
    cartaPorteDescription: "Datos fiscales para generar CFDI con Carta Porte.",
    fiscalDataDescription:
      "Activa esta opcion solo si el remitente/destinatario es distinto al cliente.",
    fiscalRfcHint: "Por defecto se usa el RFC del cliente.",
  },
  additional: {
    locationNamePlaceholder: "Ej: Bodega Principal, Sucursal Norte",
    globalInfoMessage: "Configura una direccion operativa del cliente.",
    cartaPorteDescription: "Datos fiscales para operaciones que requieran Carta Porte.",
    fiscalDataDescription:
      "Usa los datos del cliente salvo que esta direccion opere con un remitente distinto.",
    fiscalRfcHint: "Por defecto se recomienda usar el RFC del cliente.",
  },
};

