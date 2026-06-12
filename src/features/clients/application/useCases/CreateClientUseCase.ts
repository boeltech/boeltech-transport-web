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
 * Ubicación: src/features/clients/application/use-cases/CreateClientUseCase.ts
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
} from "../../domain";

// ============================================================================
// ERRORS
// ============================================================================

/**
 * El cliente ya se persistió pero falló la creación de la dirección fiscal.
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
  /**
   * Crea un cliente con su dirección fiscal (wizard)
   *
   * @param data - Datos del cliente y dirección fiscal
   * @returns Resultado con IDs del cliente y dirección creados
   * @throws Error si falla la creación del cliente o la dirección
   */
  async execute(data: CreateClientWithAddressDTO): Promise<CreateClientResult> {
    // 1. Crear el cliente
    const { id: clientId, clientCode } = await clientRepository.create(
      data.client,
    );

    try {
      // 2. Crear la dirección fiscal
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

      const address = await clientAddressRepository.create(
        clientId,
        addressData,
      );

      // 3. Contacto principal (tabla client_contacts)
      if (data.primaryContact?.fullName?.trim()) {
        try {
          await clientContactRepository.create(clientId, {
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
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la dirección fiscal.";
      throw new CreateClientAddressFailedError(
        message,
        clientId,
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
    return clientRepository.create(data);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const createClientUseCase = new CreateClientUseCase();
