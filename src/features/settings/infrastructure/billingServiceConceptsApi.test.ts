import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      get: getMock,
      post: postMock,
      put: putMock,
      delete: deleteMock,
    },
  };
});

import {
  createBillingServiceConcept,
  deleteBillingServiceConcept,
  fetchBillingServiceConcepts,
  mapBillingServiceConceptForTest,
  parseObjectImp,
  updateBillingServiceConcept,
} from "./billingServiceConceptsApi";

const BASE = "/settings/billing/service-concepts";

const camelConcept = {
  id: "svc-1",
  name: "Maniobra",
  description: null,
  claveProdServ: "78121603",
  claveUnidad: "E48",
  unidad: "Servicio",
  defaultUnitPrice: 250,
  objectImp: "02",
  ivaAplica: true,
  retencionAplica: false,
  isActive: true,
  sortOrder: 0,
};

describe("parseObjectImp", () => {
  it("acepta valores SAT válidos", () => {
    expect(parseObjectImp("01")).toBe("01");
    expect(parseObjectImp("03")).toBe("03");
    expect(parseObjectImp("04")).toBe("04");
  });

  it("default a 02 cuando ausente o inválido", () => {
    expect(parseObjectImp(undefined)).toBe("02");
    expect(parseObjectImp("99")).toBe("02");
    expect(parseObjectImp("")).toBe("02");
  });
});

describe("mapBillingServiceConceptForTest", () => {
  it("mapea campos camelCase del API al dominio", () => {
    const mapped = mapBillingServiceConceptForTest(camelConcept);

    expect(mapped).toEqual({
      id: "svc-1",
      name: "Maniobra",
      description: null,
      claveProdServ: "78121603",
      claveUnidad: "E48",
      unidad: "Servicio",
      defaultUnitPrice: 250,
      objectImp: "02",
      ivaAplica: true,
      retencionAplica: false,
      isActive: true,
      sortOrder: 0,
    });
  });

  it("default objectImp a 02 cuando viene ausente", () => {
    const mapped = mapBillingServiceConceptForTest({
      ...camelConcept,
      id: "svc-2",
      name: "Resguardo",
      defaultUnitPrice: null,
      objectImp: undefined as unknown as string,
      isActive: false,
      sortOrder: 1,
    });

    expect(mapped.objectImp).toBe("02");
    expect(mapped.isActive).toBe(false);
  });

  it("normaliza objectImp inválido a 02", () => {
    const mapped = mapBillingServiceConceptForTest({
      ...camelConcept,
      objectImp: "99",
    });
    expect(mapped.objectImp).toBe("02");
  });

  it("preserva objectImp 03", () => {
    const mapped = mapBillingServiceConceptForTest({
      ...camelConcept,
      objectImp: "03",
    });
    expect(mapped.objectImp).toBe("03");
  });
});

describe("billingServiceConceptsApi HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetch pasa is_active y mapea lista", async () => {
    getMock.mockResolvedValue({ data: [camelConcept] });

    const list = await fetchBillingServiceConcepts({ isActive: true });

    expect(getMock).toHaveBeenCalledWith(BASE, {
      params: {
        search: undefined,
        is_active: true,
      },
    });
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("Maniobra");
  });

  it("create envía snake_case y mapea respuesta", async () => {
    postMock.mockResolvedValue({
      data: { ...camelConcept, id: "svc-new", name: "Estadía" },
    });

    const created = await createBillingServiceConcept({
      name: "Estadía",
      claveProdServ: "78121603",
      claveUnidad: "E48",
      unidad: "Servicio",
      objectImp: "02",
      ivaAplica: true,
      retencionAplica: false,
    });

    expect(postMock).toHaveBeenCalledWith(
      BASE,
      expect.objectContaining({
        name: "Estadía",
        clave_prod_serv: "78121603",
        clave_unidad: "E48",
        object_imp: "02",
        iva_aplica: true,
        retencion_aplica: false,
      }),
    );
    expect(created.id).toBe("svc-new");
    expect(created.name).toBe("Estadía");
  });

  it("update envía snake_case al path con id", async () => {
    putMock.mockResolvedValue({
      data: { ...camelConcept, objectImp: "03" },
    });

    const updated = await updateBillingServiceConcept("svc-1", {
      name: "Maniobra",
      objectImp: "03",
    });

    expect(putMock).toHaveBeenCalledWith(
      `${BASE}/svc-1`,
      expect.objectContaining({
        name: "Maniobra",
        object_imp: "03",
      }),
    );
    expect(updated.objectImp).toBe("03");
  });

  it("delete llama DELETE por id (soft-delete en API)", async () => {
    deleteMock.mockResolvedValue(undefined);

    await deleteBillingServiceConcept("svc-1");

    expect(deleteMock).toHaveBeenCalledWith(`${BASE}/svc-1`);
  });
});
