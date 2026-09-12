import { branchesCopy } from "../copy/branchesCopy";

const copy = branchesCopy.detail.header;

interface BranchDetailHeaderSubtitleProps {
  code: string;
}

export function BranchDetailHeaderSubtitle({
  code,
}: BranchDetailHeaderSubtitleProps) {
  return (
    <div className="space-y-0.5">
      <p className="truncate text-sm text-muted-foreground">
        {copy.subtitle(code)}
      </p>
    </div>
  );
}
