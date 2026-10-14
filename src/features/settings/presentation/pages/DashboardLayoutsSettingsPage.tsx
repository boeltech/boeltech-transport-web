/**
 * DashboardLayoutsSettingsPage
 *
 * Admin: layout por defecto del dashboard por rol (localStorage → API futura).
 */

import { memo, useState } from "react";

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
import { Button } from "@shared/ui/button";
import { SettingsPageShell } from "@shared/ui/page-shells";

const copy = dashboardCopy.customize;

export const DashboardLayoutsSettingsPage = memo(
  function DashboardLayoutsSettingsPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole>(ROLES.ADMIN);
    const [panelOpen, setPanelOpen] = useState(true);

    const layoutApi = useDashboardLayout({
      persistMode: "role",
      roleForEdit: selectedRole,
    });

    return (
      <SettingsPageShell
        sectionTitle={copy.roleSettingsTitle}
        title={copy.roleSettingsTitle}
        description={copy.roleSettingsDescription}
      >
        <div className="max-w-lg space-y-6">
          <div className="space-y-2">
            <Label htmlFor="dashboard-role-select">{copy.selectRole}</Label>
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
            {copy.saveRoleLayout}
          </Button>
        </div>

        <DashboardCustomizePanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          layoutApi={layoutApi}
          showUserResetActions={false}
        />
      </SettingsPageShell>
    );
  },
);
