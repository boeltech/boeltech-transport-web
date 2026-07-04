export interface BillingServiceConcept {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly claveProdServ: string;
  readonly claveUnidad: string;
  readonly unidad: string;
  readonly defaultUnitPrice: number | null;
  readonly objectImp: "01" | "02" | "03" | "04";
  readonly ivaAplica: boolean;
  readonly retencionAplica: boolean;
  readonly isActive: boolean;
  readonly sortOrder: number;
}

export interface CreateBillingServiceConceptPayload {
  name: string;
  description?: string;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  defaultUnitPrice?: number;
  objectImp?: BillingServiceConcept["objectImp"];
  ivaAplica?: boolean;
  retencionAplica?: boolean;
  sortOrder?: number;
}

export type UpdateBillingServiceConceptPayload = Partial<
  CreateBillingServiceConceptPayload
> & {
  isActive?: boolean;
};
