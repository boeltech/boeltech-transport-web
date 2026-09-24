/**
 * CreateClient Use Case
 * Clean Architecture - Application Layer
 *
 * Caso de uso para crear un cliente CON su direcci?n fiscal (opcional si
 * `comercial_only`, ADR-0096).
 *
 * FLUJO:
 * 1. Crear el cliente (POST /clients)
 * 2. Crear la direcci?n fiscal si se proporcion? (POST /clients/:id/addresses)
 * 3. Crear contacto principal si se proporcion? (POST /clients/:id/contacts)
 * 4. Retornar el resultado combinado
 *
 * Si falla la direcci?n: intenta soft-delete del cliente (compensaci?n) para
 * no dejar hu?rfanos sin billing; si la compensaci?n falla, expone el cliente
 * creado para completar la direcci?n en detalle.
 *
 * Ubicaci?n: src/features/clients/application/useCases/CreateClientUseCase.ts
 */

import {
  clientRepository,
  clientAddressRepository,
  clientContactRepository,
} from "../../infrastructure";
import type {
  CreateClientDTO,
  CreateClientAddressDTO,
  CreateClientWithAddressDTO,
  CreateClientResult,
  IClientRepository,
  IClientAddressRepository,
  IClientContactRepository,
} from "../../domain";

// ============================================================================
// ERRORS
// ============================================================================

/**
 * El cliente ya se persisti? pero fall? la creaci?n de la direcci?n fiscal
 * y la compensaci?n (soft-delete) tambi?n fall?.
 * Permite al UI ofrecer ir al detalle a completar la direcci?n.
 */
export class CreateClientAddressFailedError extends Error {
  readonly clientId: string;
  readonly clientCode: string;
  readonly causeError: unknown;

  constructor(
    message: string,
    clientId: string,
    clientCode: string,
    causeError?: unknown,
  ) {
    super(message);
    this.name = "CreateClientAddressFailedError";
    this.clientId = clientId;
    this.clientCode = clientCode;
    this.causeError = causeError;
  }
}

/**
 * Fall? la direcci?n fiscal y el cliente se revirti? (soft-delete).
 * El alta se trata como fallida; el RFC queda libre para reintentar.
 */
export class CreateClientCompensatedError extends Error {
  readonly clientCode: string;
  readonly causeError: unknown;

  constructor(message: string, clientCode: string, causeError?: unknown) {
    super(message);
    this.name = "CreateClientCompensatedError";
    this.clientCode = clientCode;
    this.causeError = causeError;
  }
}

/**
 * Cliente y direcci?n creados, pero fall? el contacto principal opcional.
 */
export class CreateClientPrimaryContactFailedError extends Error {
  readonly clientId: string;
  readonly clientCode: string;
  readonly addressId: string | undefined;
  readonly causeError: unknown;

  constructor(
    message: string,
    clientId: string,
    clientCode: string,
    addressId: string | undefined,
    causeError?: unknown,
  ) {
    super(message);
    this.name = "CreateClientPrimaryContactFailedError";
    this.clientId = clientId;
    this.clientCode = clientCode;
    this.addressId = addressId;
    this.causeError = causeError;
  }
}

// ============================================================================
// USE CASE
// ============================================================================

export class CreateClientUseCase {
  private readonly clients: IClientRepository;
  private readonly addresses: IClientAddressRepository;
  private readonly contacts: IClientContactRepository;

  constructor(
    clients: IClientRepository = clientRepository,
    addresses: IClientAddressRepository = clientAddressRepository,
    contacts: IClientContactRepository = clientContactRepository,
  ) {
    this.clients = clients;
    this.addresses = addresses;
    this.contacts = contacts;
  }

  /**
   * Crea un cliente; direcci?n fiscal solo si el wizard la envi?.
   */
  async execute(data: CreateClientWithAddressDTO): Promise<CreateClientResult> {
    const { id: clientId, clientCode } = await this.clients.create(data.client);

    let addressId: string | undefined;

    try {
      if (data.billingAddress) {
        const addressData: CreateClientAddressDTO = {
          ...data.billingAddress,
          addressType: "billing",
          isPrimary: true,
        };

        const taxId = data.client.taxId?.trim();
        if (!addressData.rfcRemitenteDestinatario && taxId) {
          addressData.rfcRemitenteDestinatario = taxId;
        }
        if (!addressData.nombreRemitenteDestinatario) {
          addressData.nombreRemitenteDestinatario = data.client.legalName;
        }

        const address = await this.addresses.create(clientId, addressData);
        addressId = address.id;
      }

      if (data.primaryContact?.fullName?.trim()) {
        try {
          await this.contacts.create(clientId, {
            ...data.primaryContact,
            isPrimary: true,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "No se pudo registrar el contacto principal.";
          throw new CreateClientPrimaryContactFailedError(
            message,
            clientId,
            clientCode,
            addressId,
            error,
          );
        }
      }

      return {
        clientId,
        clientCode,
        addressId,
      };
    } catch (error) {
      if (error instanceof CreateClientPrimaryContactFailedError) {
        throw error;
      }

      const addressMessage =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la direcci?n fiscal.";

      try {
        await this.clients.delete(clientId);
      } catch {
        throw new CreateClientAddressFailedError(
          addressMessage,
          clientId,
          clientCode,
          error,
        );
      }

      throw new CreateClientCompensatedError(
        "No se pudo completar el alta del cliente. La direcci?n fiscal no se registr?; puedes reintentar con los mismos datos.",
        clientCode,
        error,
      );
    }
  }

  /**
   * Crea solo el cliente (sin direcci?n)
   * ?til para casos donde se crean direcciones por separado
   */
  async createClientOnly(
    data: CreateClientDTO,
  ): Promise<{ id: string; clientCode: string }> {
    return this.clients.create(data);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const createClientUseCase = new CreateClientUseCase();
