/**
 * CreateClient Use Case
 * Clean Architecture - Application Layer
 *
 * Caso de uso para crear un cliente CON su dirección fiscal obligatoria.
 * Este es el caso de uso principal usado por el wizard de creación.
 *
 * FLUJO:
 * 1. Crear el cliente (POST /clients)
 * 2. Crear la dirección fiscal (POST /clients/:id/addresses)
 * 3. Crear contacto principal si se proporcionó (POST /clients/:id/contacts)
 * 4. Retornar el resultado combinado
 *
 * Si falla la dirección: intenta soft-delete del cliente (compensación) para
 * no dejar huérfanos sin billing; si la compensación falla, expone el cliente
 * creado para completar la dirección en detalle.
 *
 * Ubicación: src/features/clients/application/useCases/CreateClientUseCase.ts
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
 * El cliente ya se persistió pero falló la creación de la dirección fiscal
 * y la compensación (soft-delete) también falló.
 * Permite al UI ofrecer ir al detalle a completar la dirección.
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
 * Falló la dirección fiscal y el cliente se revirtió (soft-delete).
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
 * Cliente y dirección creados, pero falló el contacto principal opcional.
 */
export class CreateClientPrimaryContactFailedError extends Error {
  readonly clientId: string;
  readonly clientCode: string;
  readonly addressId: string;
  readonly causeError: unknown;

  constructor(
    message: string,
    clientId: string,
    clientCode: string,
    addressId: string,
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
   * Crea un cliente con su dirección fiscal (wizard)
   *
   * @param data - Datos del cliente y dirección fiscal
   * @returns Resultado con IDs del cliente y dirección creados
   * @throws Error si falla la creación del cliente o la dirección
   */
  async execute(data: CreateClientWithAddressDTO): Promise<CreateClientResult> {
    const { id: clientId, clientCode } = await this.clients.create(data.client);

    try {
      const addressData: CreateClientAddressDTO = {
        ...data.billingAddress,
        addressType: "billing",
        isPrimary: true,
      };

      if (!addressData.rfcRemitenteDestinatario) {
        addressData.rfcRemitenteDestinatario = data.client.taxId;
      }
      if (!addressData.nombreRemitenteDestinatario) {
        addressData.nombreRemitenteDestinatario = data.client.legalName;
      }

      const address = await this.addresses.create(clientId, addressData);

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
            address.id,
            error,
          );
        }
      }

      return {
        clientId,
        clientCode,
        addressId: address.id,
      };
    } catch (error) {
      if (error instanceof CreateClientPrimaryContactFailedError) {
        throw error;
      }

      const addressMessage =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la dirección fiscal.";

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
        "No se pudo completar el alta del cliente. La dirección fiscal no se registró; puedes reintentar con los mismos datos.",
        clientCode,
        error,
      );
    }
  }

  /**
   * Crea solo el cliente (sin dirección)
   * Útil para casos donde se crean direcciones por separado
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
