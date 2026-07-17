import { branchesCopy } from "../copy/branchesCopy";

const copy = branchesCopy.detail.header;

interface BranchDetailHeaderSubtitleProps {
  code: string;
}

export function BranchDetailHeaderSubtitle({
  code,
}: BranchDetailHeaderSubtitleProps) {
  return <p className="text-sm text-muted-foreground">{copy.subtitle(code)}</p>;
}
