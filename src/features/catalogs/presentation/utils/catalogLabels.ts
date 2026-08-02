/**
 * Etiquetas de presentación derivadas del tipo de catálogo.
 *
 * El API entrega `source` en clave (SAT / BANXICO / INTERNAL); aquí se traduce
 * a lenguaje operativo. La política de mutación vive en el dominio y no se
 * consulta desde estos helpers.
 */

import { CatalogSource, type CatalogType } from "../../domain";
import { catalogsCopy } from "../copy/catalogsCopy";

type CatalogSourceInfo = Pick<CatalogType, "source">;

/** Etiqueta autónoma: "Publicado por el SAT", "Del sistema". */
export function resolveCatalogPublisher(type: CatalogSourceInfo): string {
  switch (type.source) {
    case CatalogSource.SAT:
      return catalogsCopy.publisher.sat;
    case CatalogSource.BANXICO:
      return catalogsCopy.publisher.banxico;
    default:
      return catalogsCopy.publisher.system;
  }
}

/** Nombre para insertar en una frase: "Lo publica el SAT y…". */
export function resolveCatalogSourceName(type: CatalogSourceInfo): string {
  switch (type.source) {
    case CatalogSource.BANXICO:
      return catalogsCopy.source.banxico;
    case CatalogSource.INTERNAL:
      return catalogsCopy.source.system;
    default:
      return catalogsCopy.source.sat;
  }
}
