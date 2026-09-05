import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateCorridorsSection } from "./TemplateCorridorsSection";

const copy = compensationCopy.builder;

type BuilderCorridorsSectionProps = Pick<UseCompensationTemplateFormResult, "form">;

export function BuilderCorridorsSection({ form }: BuilderCorridorsSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{copy.corridorsDescription}</p>
      <TemplateCorridorsSection control={form.control} stepPrefix="" />
    </div>
  );
}
