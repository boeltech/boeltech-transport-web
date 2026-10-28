import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { platformApi } from "../../infrastructure/platformApi";
import { platformQueryKeys } from "../../domain/entities";
import { opsCopy } from "./opsCopy";
import {
  OpsCommand,
  OpsCommandDialog,
  OpsCommandDialogContent,
  OpsCommandEmpty,
  OpsCommandGroup,
  OpsCommandInput,
  OpsCommandItem,
  OpsCommandList,
} from "./ui";

interface PlatformCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformCommandPalette({
  open,
  onOpenChange,
}: PlatformCommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setSearch("");
    onOpenChange(next);
  };

  const { data } = useQuery({
    queryKey: [...platformQueryKeys.tenantList({ search, limit: 12 }), "cmdk"],
    queryFn: () => platformApi.listTenants({ search, limit: 12, page: 1 }),
    enabled: open,
    staleTime: 15_000,
  });

  const tenants = data?.data ?? [];

  return (
    <OpsCommandDialog open={open} onOpenChange={handleOpenChange}>
      <OpsCommandDialogContent>
        <OpsCommand shouldFilter={false}>
          <OpsCommandInput
            placeholder={opsCopy.cmdk.placeholder}
            value={search}
            onValueChange={setSearch}
            aria-label={opsCopy.cmdk.placeholder}
          />
          <OpsCommandList>
            <OpsCommandEmpty>
              <span className="ops-empty-title block">{opsCopy.cmdk.empty}</span>
              <span className="ops-empty-description mt-1 block">
                {opsCopy.cmdk.emptyHint}
              </span>
            </OpsCommandEmpty>
            <OpsCommandGroup heading={opsCopy.cmdk.groupTenants}>
              {tenants.map((tenant) => (
                <OpsCommandItem
                  key={tenant.id}
                  value={`${tenant.name} ${tenant.subdomain} ${tenant.id}`}
                  onSelect={() => {
                    handleOpenChange(false);
                    void navigate(`/platform/tenants/${tenant.id}`);
                  }}
                >
                  <Search className="h-4 w-4 opacity-50" aria-hidden />
                  <span className="truncate">{tenant.name}</span>
                  <span className="ml-auto text-xs ops-text-muted">
                    {tenant.subdomain}
                  </span>
                </OpsCommandItem>
              ))}
            </OpsCommandGroup>
          </OpsCommandList>
        </OpsCommand>
      </OpsCommandDialogContent>
    </OpsCommandDialog>
  );
}
