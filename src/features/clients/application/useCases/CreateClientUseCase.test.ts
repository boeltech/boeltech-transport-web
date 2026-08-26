import { describe, expect, it, vi } from "vitest";
import type {
  CreateClientWithAddressDTO,
  IClientAddressRepository,
  IClientContactRepository,
  IClientRepository,
} from "../../domain";
import {
  CreateClientCompensatedError,
  CreateClientPrimaryContactFailedError,
  CreateClientUseCase,
} from "./CreateClientUseCase";

const basePayload: CreateClientWithAddressDTO = {
  client: {
    type: "company",
    legalName: "Acme SA",
    taxId: "AAA010101AAA",
    taxRegime: "601",
    paymentTerms: "cash",
    creditDays: 0,
  },
  billingAddress: {
    addressType: "billing",
    satStateCode: "09",
    postalCode: "06600",
  },
};

function createClientsRepo(
  overrides: Partial<IClientRepository> = {},
): IClientRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(async () => ({ id: "client-1", clientCode: "C-0001" })),
    update: vi.fn(),
    delete: vi.fn(async () => undefined),
    ...overrides,
  };
}

function createAddressesRepo(
  overrides: Partial<IClientAddressRepository> = {},
): IClientAddressRepository {
  return {
    findByClientId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(async () => ({ id: "addr-1" }) as never),
    update: vi.fn(),
    setPrimaryAddress: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

function createContactsRepo(
  overrides: Partial<IClientContactRepository> = {},
): IClientContactRepository {
  return {
    findByClientId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(async () => ({ id: "contact-1" }) as never),
    update: vi.fn(),
    setPrimary: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe("CreateClientUseCase", () => {
  it("crea cliente, dirección y contacto en el camino feliz", async () => {
    const clients = createClientsRepo();
    const addresses = createAddressesRepo();
    const contacts = createContactsRepo();
    const useCase = new CreateClientUseCase(clients, addresses, contacts);

    const result = await useCase.execute({
      ...basePayload,
      // WS-B: POST /clients sin contactos legacy; contacto vía primaryContact.
      primaryContact: {
        fullName: "Ana Pérez",
        phone: "5512345678",
        email: "ana@acme.test",
        isPrimary: true,
      },
    });

    expect(result).toEqual({
      clientId: "client-1",
      clientCode: "C-0001",
      addressId: "addr-1",
    });
    expect(clients.create).toHaveBeenCalledOnce();
    const createArg = vi.mocked(clients.create).mock.calls[0]?.[0];
    expect(createArg).toEqual(basePayload.client);
    expect(createArg).not.toHaveProperty("contactName");
    expect(createArg).not.toHaveProperty("contactPosition");
    expect(createArg).not.toHaveProperty("phone");
    expect(createArg).not.toHaveProperty("secondaryPhone");
    expect(createArg).not.toHaveProperty("email");
    expect(addresses.create).toHaveBeenCalledWith(
      "client-1",
      expect.objectContaining({
        addressType: "billing",
        isPrimary: true,
        rfcRemitenteDestinatario: "AAA010101AAA",
        nombreRemitenteDestinatario: "Acme SA",
      }),
    );
    expect(contacts.create).toHaveBeenCalledOnce();
    expect(contacts.create).toHaveBeenCalledWith(
      "client-1",
      expect.objectContaining({
        fullName: "Ana Pérez",
        phone: "5512345678",
        email: "ana@acme.test",
        isPrimary: true,
      }),
    );
    expect(clients.delete).not.toHaveBeenCalled();
  });

  it("compensa con soft-delete si falla la dirección", async () => {
    const clients = createClientsRepo();
    const addresses = createAddressesRepo({
      create: vi.fn(async () => {
        throw new Error("address boom");
      }),
    });
    const contacts = createContactsRepo();
    const useCase = new CreateClientUseCase(clients, addresses, contacts);

    await expect(useCase.execute(basePayload)).rejects.toBeInstanceOf(
      CreateClientCompensatedError,
    );
    expect(clients.delete).toHaveBeenCalledWith("client-1");
    expect(contacts.create).not.toHaveBeenCalled();
  });

  it("expone AddressFailedError si la compensación también falla", async () => {
    const clients = createClientsRepo({
      delete: vi.fn(async () => {
        throw new Error("delete boom");
      }),
    });
    const addresses = createAddressesRepo({
      create: vi.fn(async () => {
        throw new Error("address boom");
      }),
    });
    const contacts = createContactsRepo();
    const useCase = new CreateClientUseCase(clients, addresses, contacts);

    await expect(useCase.execute(basePayload)).rejects.toMatchObject({
      name: "CreateClientAddressFailedError",
      clientId: "client-1",
      clientCode: "C-0001",
    });
    expect(clients.delete).toHaveBeenCalledWith("client-1");
  });

  it("no borra el cliente si solo falla el contacto principal", async () => {
    const clients = createClientsRepo();
    const addresses = createAddressesRepo();
    const contacts = createContactsRepo({
      create: vi.fn(async () => {
        throw new Error("contact boom");
      }),
    });
    const useCase = new CreateClientUseCase(clients, addresses, contacts);

    await expect(
      useCase.execute({
        ...basePayload,
        primaryContact: { fullName: "Ana Pérez", isPrimary: true },
      }),
    ).rejects.toBeInstanceOf(CreateClientPrimaryContactFailedError);

    expect(clients.delete).not.toHaveBeenCalled();
  });
});
