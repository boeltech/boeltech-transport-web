/**
 * @deprecated  ClientAddressSection fue reemplazado por
 *              `<ClientAddressMasterDetail>` (master-detail inline, sin Modal).
 *              Este archivo es un tombstone y puede borrarse de forma segura.
 *
 * Migración:
 * - Antes: lista vertical de cards + Modal (Dialog) por cada acción de edición.
 * - Ahora: master (lista compacta) + detail (vista o form inline) en el mismo
 *   tab, sin perder el contexto del cliente ni de la lista.
 *
 * Razón del cambio: el Modal ocultaba toda la pantalla mientras se editaba
 * una dirección, lo que rompía la sensación de "estoy gestionando este cliente".
 *
 * Ver (diseño fuente): D:\cowork\boeltech\erp-transport\design\propuesta-ux-modulo-clientes.md
 */
export {};
