import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { useBranchEmployees } from "../../application";
import { branchesCopy } from "../copy/branchesCopy";

interface BranchAssignedEmployeesCardProps {
  branchId: string;
}

export function BranchAssignedEmployeesCard({
  branchId,
}: BranchAssignedEmployeesCardProps) {
  const { data: employees = [], isLoading } = useBranchEmployees(branchId);
  const copy = branchesCopy.detail.employees;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {branchesCopy.detail.cards.employees}
          </span>
          {!isLoading ? (
            <span className="text-sm font-normal text-muted-foreground">
              {copy.count(employees.length)}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : employees.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {employees.map((employee) => (
              <li
                key={employee.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{employee.fullName}</p>
                  <p className="text-muted-foreground">
                    {[employee.employeeNumber, employee.department, employee.position]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Link
                  to={`/employees/${employee.id}`}
                  className="shrink-0 text-primary underline-offset-4 hover:underline"
                >
                  {copy.viewEmployee}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
