import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { SettingsLayout } from "../components/SettingsLayout";
import { TenantLocationMasterDetail } from "../components/TenantLocationMasterDetail";
import { tenantLocationsCopy } from "../copy/tenantLocationsCopy";

const copy = tenantLocationsCopy;

export function TenantLocationsPage() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <SettingsLayout
      sectionTitle={copy.page.breadcrumb}
      title={copy.page.title}
      description={copy.page.description}
    >
      <div className="space-y-4">
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
          <div className="rounded-lg border border-info/40 bg-info-soft text-info-soft-foreground">
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-info/5"
            >
              <Info
                className="h-4 w-4 shrink-0 text-info"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-none tracking-tight">
                  {copy.guide.title}
                </span>
                {!guideOpen ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {copy.guide.collapsedHint}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  guideOpen && "rotate-180",
                )}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 border-t border-info/20 px-4 py-3 pl-[2.75rem] text-sm">
                <p>{copy.guide.use}</p>
                <p className="font-medium">{copy.guide.notTitle}</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>{copy.guide.notClient}</li>
                  <li>{copy.guide.notBranch}</li>
                  <li>{copy.guide.notFiscal}</li>
                  <li>{copy.guide.notStop}</li>
                </ul>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
        <TenantLocationMasterDetail />
      </div>
    </SettingsLayout>
  );
}
