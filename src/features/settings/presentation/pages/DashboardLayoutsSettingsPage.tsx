/**
 * DashboardLayoutsSettingsPage
 *
 * Admin: layout por defecto del dashboard por rol (localStorage → API futura).
 */

import { memo, useState } from "react";
import { LayoutDashboard } from "lucide-react";

import {
  useDashboardLayout,
  DashboardCustomizePanel,
} from "@features/dashboard";
import { dashboardCopy } from "@features/dashboard/presentation/copy/dashboardCopy";
import {
  ROLE_OPTIONS,
  type UserRole,
  ROLES,
} from "@shared/constants/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Label } from "@shared/ui/label";
import { Button } from "@/shared/ui/button";
import { SettingsLayout } from "../components/SettingsLayout";

export const DashboardLayoutsSettingsPage = memo(
  function DashboardLayoutsSettingsPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole>(ROLES.ADMIN);
    const [panelOpen, setPanelOpen] = useState(true);

    const layoutApi = useDashboardLayout({
      persistMode: "role",
      roleForEdit: selectedRole,
    });

    return (
      <SettingsLayout sectionTitle={dashboardCopy.customize.roleSettingsTitle}>
        <div className="max-w-lg space-y-6">
          <p className="text-sm text-muted-foreground">
            {dashboardCopy.customize.roleSettingsDescription}
          </p>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
            <LayoutDashboard className="h-8 w-8 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              Los cambios se guardan al mover u ocultar widgets. El usuario puede
              personalizar después; hereda este default si no tiene override propio.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboard-role-select">
              {dashboardCopy.customize.selectRole}
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as UserRole)}
            >
              <SelectTrigger id="dashboard-role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" onClick={() => setPanelOpen(true)}>
            {dashboardCopy.customize.saveRoleLayout}
          </Button>
        </div>

        <DashboardCustomizePanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          layoutApi={layoutApi}
          showUserResetActions={false}
        />
      </SettingsLayout>
    );
  },
);
