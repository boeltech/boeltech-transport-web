/**
 * EmployeeEditSidebar — thin adapter over LongFormSectionNav (DS F3).
 */

import type { LucideIcon } from "lucide-react";
import { LongFormSectionNav } from "@shared/ui/form";
import { employeesCopy } from "../../copy";

const sidebarCopy = employeesCopy.form.sidebar;

export interface EmployeeEditSectionItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface EmployeeEditSidebarProps {
  sections: EmployeeEditSectionItem[];
  activeSectionId: string;
  errorCountBySection: Record<string, number>;
  onSelectSection: (id: string) => void;
}

export function EmployeeEditSidebar({
  sections,
  activeSectionId,
  errorCountBySection,
  onSelectSection,
}: EmployeeEditSidebarProps) {
  return (
    <LongFormSectionNav
      sections={sections}
      activeSectionId={activeSectionId}
      errorCountBySection={errorCountBySection}
      onSelectSection={onSelectSection}
      title={sidebarCopy.title}
      errorsTitle={sidebarCopy.errorsTitle}
      errorsAria={sidebarCopy.errorsAria}
    />
  );
}
