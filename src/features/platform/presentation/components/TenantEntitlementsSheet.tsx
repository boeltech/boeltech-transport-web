import { useMemo } from "react";
import { Layers } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Badge } from "@shared/ui/badge";
import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import { useToast } from "@shared/hooks";
import {
  resolveCatalogListPrice,
} from "@features/billing/presentation/utils/commercialPrice";
import type { PlatformTenantListItem } from "../../domain/entities";
import {
  useMutatePlatformTenantEntitlement,
  usePlatformTenantEntitlements,
} from "../../application/hooks/usePlatformBilling";
import { platformCopy } from "../copy/platformCopy";
import { formatPlanPriceCents } from "../utils/formatPlanLabel";

interface TenantEntitlementsSheetProps {
  tenant: PlatformTenantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canMutate: boolean;
}

export function TenantEntitlementsSheet({
  tenant,
  open,
  onOpenChange,
  canMutate,
}: TenantEntitlementsSheetProps) {
  const { toast } = useToast();
  const tenantId = tenant?.id ?? "";
  const { data: entitlements, isLoading } = usePlatformTenantEntitlements(tenantId);

  const mutateMutation = useMutatePlatformTenantEntitlement({
    onSuccess: () => {
      toast({
        title: platformCopy.tenants.entitlements.success,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: platformCopy.tenants.entitlements.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const catalogItems = useMemo(() => {
    if (!entitlements) return [];
    return [...entitlements.catalog].sort((a, b) =>
      a.name.localeCompare(b.name, "es"),
    );
  }, [entitlements]);

  const catalogByCode = useMemo(() => {
    if (!entitlements) return new Map();
    return new Map(entitlements.catalog.map((item) => [item.code, item]));
  }, [entitlements]);

  const copy = platformCopy.tenants.entitlements;

  const handleToggle = async (moduleCode: string, isActive: boolean) => {
    if (!tenant || !canMutate) return;
    await mutateMutation.mutateAsync({
      tenantId: tenant.id,
      payload: {
        moduleCode,
        action: isActive ? "deactivate" : "activate",
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {entitlements ? (
            <span className="text-xs text-muted-foreground">
              {copy.effectiveCount(entitlements.effectiveModuleCodes.length)}
            </span>
          ) : null}
        </div>

        <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{copy.loading}</p>
          ) : catalogItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            catalogItems.map((item) => {
              const isPack = item.kind === "pack";
              const isPending =
                mutateMutation.isPending &&
                mutateMutation.variables?.payload.moduleCode === item.code;

              return (
                <div
                  key={item.code}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      {isPack ? (
                        <Badge variant="outline" className="text-[10px]">
                          <Layers className="mr-1 h-3 w-3" />
                          {copy.packBadge}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.code}</p>
                    {item.memberCodes.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {copy.includesMembers(item.memberCodes.length)}
                      </p>
                    ) : null}
                    {(() => {
                      const activeLine = entitlements?.directEntitlements.find(
                        (line) => line.moduleCode === item.code,
                      );
                      if (activeLine) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            {copy.lockedPrice(
                              formatPlanPriceCents(activeLine.priceLockedCents),
                            )}
                          </p>
                        );
                      }
                      const preview = resolveCatalogListPrice(item, catalogByCode);
                      return (
                        <p className="text-xs text-muted-foreground">
                          {copy.previewPrice(
                            formatPlanPriceCents(preview.cents),
                            preview.tier,
                          )}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Label htmlFor={`ent-${item.code}`} className="sr-only">
                      {item.name}
                    </Label>
                    <Switch
                      id={`ent-${item.code}`}
                      checked={item.isActiveForTenant}
                      disabled={!canMutate || isPending}
                      onCheckedChange={() =>
                        void handleToggle(item.code, item.isActiveForTenant)
                      }
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!canMutate ? (
          <p className="mt-4 text-xs text-muted-foreground">{copy.readOnlyHint}</p>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
