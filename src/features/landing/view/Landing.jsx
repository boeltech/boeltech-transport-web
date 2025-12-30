import { Can } from "@shared/ui/Can";
import { usePermissions } from "@app/providers/PermissionsProvider";
import { Button } from "@/shared/ui/button";

export const Landing = () => {
  const { can, isAdmin } = usePermissions();

  return (
    <div>
      <Button>Landing Page</Button>
    </div>
  );
};
