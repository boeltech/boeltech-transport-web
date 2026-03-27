/**
 * useCatalogImport Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks para importación y validación de catálogos desde CSV.
 *
 * ACTUALIZADO: Incluye suggestNextVersion() para generar versiones
 * con timestamp automático.
 *
 * @example
 * const { suggestedVersion } = useCatalogImportWizard(currentVersion);
 * // suggestedVersion = "1.0.20260325"
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useToast } from "@shared/hooks/useToast";
import { suggestNextVersion } from "@shared/utils/dateUtils";
import {
  type CatalogImportResult,
  type CatalogValidationResult,
  type CatalogImportOptions,
  catalogQueryKeys,
  type CatalogVersion,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";

// ============================================================================
// TYPES
// ============================================================================

export interface ImportCatalogParams {
  typeCode: string;
  file: File;
  options: CatalogImportOptions;
}

export interface ValidateCatalogParams {
  typeCode: string;
  file: File;
}

// ============================================================================
// IMPORT HOOK
// ============================================================================

/**
 * Hook para importar un catálogo desde CSV
 */
export function useCatalogImport(
  options?: Omit<
    UseMutationOptions<CatalogImportResult, Error, ImportCatalogParams>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      typeCode,
      file,
      options: importOptions,
    }: ImportCatalogParams) => {
      return catalogRepository.importCatalog(typeCode, file, importOptions);
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.statistics(),
      });
      queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.items(variables.typeCode),
      });

      if (data.success) {
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${data.insertedCount} registros nuevos y se actualizaron ${data.updatedCount} existentes.`,
        });
      } else {
        toast({
          title: "Importación completada con errores",
          description: `${data.errorCount} registros con errores de ${data.totalRows} totales.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error en la importación",
        description:
          error.message || "Ocurrió un error al importar el catálogo",
        variant: "destructive",
      });
    },
    ...options,
  });
}

// ============================================================================
// VALIDATE HOOK
// ============================================================================

/**
 * Hook para validar un CSV antes de importar (dry run)
 */
export function useCatalogValidate(
  options?: Omit<
    UseMutationOptions<CatalogValidationResult, Error, ValidateCatalogParams>,
    "mutationFn"
  >,
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ typeCode, file }: ValidateCatalogParams) => {
      return catalogRepository.validateImport(typeCode, file);
    },
    onSuccess: (data) => {
      if (data.isValid) {
        toast({
          title: "Archivo válido",
          description: `${data.validRows} registros listos para importar.`,
        });
      } else {
        toast({
          title: "Archivo con errores",
          description: `${data.errors.length} errores encontrados en el archivo.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error en la validación",
        description: error.message || "Ocurrió un error al validar el archivo",
        variant: "destructive",
      });
    },
    ...options,
  });
}

// ============================================================================
// COMBINED HOOK FOR WIZARD
// ============================================================================

/**
 * Hook combinado para el wizard de importación.
 *
 * @param currentVersion - Versión actual del catálogo (opcional).
 *                         Si se proporciona, suggestedVersion se basará en ella.
 *
 * @example
 * // En el wizard:
 * const { data: catalogType } = useCatalogType(typeCode);
 * const wizard = useCatalogImportWizard(catalogType?.currentVersion);
 *
 * // Usar en el formulario:
 * <Input defaultValue={wizard.suggestedVersion} ... />
 */
export function useCatalogImportWizard(currentVersion?: CatalogVersion | null) {
  const validateMutation = useCatalogValidate();
  const importMutation = useCatalogImport();

  // Generar versión sugerida basada en la versión actual
  // Ejemplo: currentVersion="1.0.20260320" → suggestedVersion="1.0.20260325"
  // Ejemplo: currentVersion=null → suggestedVersion="1.0.20260325"
  const suggestedVersion = suggestNextVersion(currentVersion?.version);

  return {
    // Validation
    validate: validateMutation.mutate,
    validateAsync: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    validationResult: validateMutation.data,
    validationError: validateMutation.error,
    resetValidation: validateMutation.reset,

    // Import
    import: importMutation.mutate,
    importAsync: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    importResult: importMutation.data,
    importError: importMutation.error,
    resetImport: importMutation.reset,

    // Version suggestion
    suggestedVersion,

    // Combined state
    isProcessing: validateMutation.isPending || importMutation.isPending,

    // Reset all
    resetAll: () => {
      validateMutation.reset();
      importMutation.reset();
    },
  };
}
