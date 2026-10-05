import { memo } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@shared/ui/button";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { useHelpPanel } from "./HelpPanelController";

const copy = helpCenterCopy.aria;

export const HelpPanelButton = memo(function HelpPanelButton() {
  const { openHelpPanel } = useHelpPanel();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openHelpPanel()}
      aria-label={copy.openHelp}
    >
      <CircleHelp className="h-5 w-5" />
    </Button>
  );
});
