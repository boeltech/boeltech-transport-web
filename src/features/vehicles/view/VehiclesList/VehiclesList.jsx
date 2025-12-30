import { Can } from '@shared/ui/Can';
import { usePermissions } from '@app/providers/PermissionsProvider';

export const VehiclesList = () => {
  const { can, isAdmin } = usePermissions();

  return (
    <div>
      {/* Botón condicional */}
      <Can permission="vehicles.create">
        <Button>Nuevo Vehículo</Button>
      </Can>

      {/* Lógica en código */}
      {can('vehicles.update') && (
        <Button variant="outline">Editar</Button>
      )}

      {/* Solo admin */}
      {isAdmin() && (
        <Button variant="destructive">Eliminar Todo</Button>
      )}

      {/* Múltiples permisos (any) */}
      <Can permissions={['vehicles.update', 'vehicles.delete']}>
        <ActionsMenu />
      </Can>

      {/* Múltiples permisos (all) */}
      <Can permissions={['invoices.read', 'invoices.create']} requireAll>
        <InvoiceButton />
      </Can>
    </div>
  );
};