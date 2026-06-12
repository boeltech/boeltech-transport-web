/**
 * ClientContactsMasterDetail — CRUD de contactos por cliente (WS-B)
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, Plus, Users } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import { useMediaQuery } from "@shared/hooks";

import {
  useClientContacts,
  useCreateClientContact,
  useDeleteClientContact,
  useSetPrimaryClientContact,
  useUpdateClientContact,
} from "../../application";
import type { ClientContact } from "../../domain";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import {
  ClientContactForm,
  type ClientContactFormRef,
} from "./ClientContactForm";
import { ClientContactListRow } from "./ClientContactListRow";
import { ClientContactDetailView } from "./ClientContactDetailView";
import {
  clientContactFormDataToCreateDto,
  clientContactFormDataToUpdateDto,
  clientContactToFormValues,
  type ClientContactFormData,
} from "../validation/clientContactSchema";

const copy = clientDetailCopy.contacts;

export interface ClientContactsMasterDetailProps {
  clientId: string;
  readOnly?: boolean;
  className?: string;
}

type Mode = "view" | "edit" | "create";

function sortContacts(list: ClientContact[]): ClientContact[] {
  return [...list].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.fullName.localeCompare(b.fullName, "es");
  });
}

export function ClientContactsMasterDetail({
  clientId,
  readOnly = false,
  className,
}: ClientContactsMasterDetailProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const { data: contacts, isLoading } = useClientContacts(clientId);
  const sorted = useMemo(
    () => (contacts ? sortContacts(contacts) : []),
    [contacts],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [pendingDelete, setPendingDelete] = useState<ClientContact | null>(null);
  const formRef = useRef<ClientContactFormRef>(null);
  const [formData, setFormData] = useState<ClientContactFormData | null>(null);
  const effectiveMode: Mode = readOnly ? "view" : mode;

  const resolvedViewId = useMemo(() => {
    if (sorted.length === 0) return null;
    if (selectedId != null && sorted.some((c) => c.id === selectedId)) {
      return selectedId;
    }
    return sorted[0].id;
  }, [sorted, selectedId]);

  const listHighlightId =
    effectiveMode === "edit" ? (selectedId ?? resolvedViewId) : resolvedViewId;

  const selectedContact = useMemo(
    () => sorted.find((c) => c.id === (selectedId ?? resolvedViewId)) ?? null,
    [sorted, selectedId, resolvedViewId],
  );

  const createMutation = useCreateClientContact();
  const updateMutation = useUpdateClientContact();
  const setPrimaryMutation = useSetPrimaryClientContact();
  const deleteMutation = useDeleteClientContact();
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    setPrimaryMutation.isPending ||
    deleteMutation.isPending;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMode("view");
    setFormData(null);
  };

  const handleStartCreate = () => {
    if (readOnly) return;
    setSelectedId(null);
    setMode("create");
    setFormData(null);
  };

  const handleStartEdit = () => {
    setSelectedId((prev) => prev ?? resolvedViewId);
    setMode("edit");
    setFormData(null);
  };

  const handleCancelForm = () => {
    setMode("view");
    setFormData(null);
    if (selectedId === null && sorted.length > 0) {
      setSelectedId(sorted[0].id);
    }
  };

  const handleSubmitForm = async () => {
    const valid = await formRef.current?.triggerValidation();
    if (!valid || !formData) return;

    if (mode === "create") {
      createMutation.mutate(
        {
          clientId,
          data: clientContactFormDataToCreateDto(formData),
        },
        {
          onSuccess: (created) => {
            setMode("view");
            setFormData(null);
            setSelectedId(created.id);
          },
        },
      );
    } else if (mode === "edit") {
      const contactId = selectedId ?? resolvedViewId;
      if (!contactId) return;
      updateMutation.mutate(
        {
          clientId,
          contactId,
          data: clientContactFormDataToUpdateDto(formData),
        },
        {
          onSuccess: () => {
            setMode("view");
            setFormData(null);
          },
        },
      );
    }
  };

  const handleSubmitFormRef = useRef(handleSubmitForm);
  const handleCancelFormRef = useRef(handleCancelForm);

  useEffect(() => {
    handleSubmitFormRef.current = handleSubmitForm;
    handleCancelFormRef.current = handleCancelForm;
  });

  useEffect(() => {
    if (readOnly) return;
    if (effectiveMode !== "create" && effectiveMode !== "edit") return;
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSubmitFormRef.current();
      }
      if (event.key === "Escape" && !isMobile) {
        event.preventDefault();
        handleCancelFormRef.current();
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [effectiveMode, isMobile, readOnly]);

  const handleSetPrimary = () => {
    const contactId = selectedId ?? resolvedViewId;
    if (!contactId) return;
    setPrimaryMutation.mutate({ clientId, contactId });
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(
      { clientId, contactId: pendingDelete.id },
      { onSuccess: () => setPendingDelete(null) },
    );
  };

  const editFormDefaults = useMemo(() => {
    if (effectiveMode !== "edit" || !selectedContact) return undefined;
    return clientContactToFormValues(selectedContact);
  }, [effectiveMode, selectedContact]);

  const showEmptyState =
    !isLoading && sorted.length === 0 && effectiveMode !== "create";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">
            {copy.title}
            {sorted.length > 0 ? (
              <span className="ml-1 font-normal text-muted-foreground">
                ({sorted.length})
              </span>
            ) : null}
          </h3>
        </div>
        {!readOnly ? (
          <Button
            size="sm"
            onClick={handleStartCreate}
            disabled={isPending || effectiveMode === "create"}
          >
            <Plus className="mr-2 h-4 w-4" />
            {copy.addNew}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : showEmptyState ? (
        <div className="rounded-md border">
          <EmptyState
            icon={<Users />}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
            cta={
              readOnly
                ? undefined
                : {
                    label: copy.addFirst,
                    icon: <Plus className="h-4 w-4" />,
                    onClick: handleStartCreate,
                  }
            }
            size="md"
          />
        </div>
      ) : (
        <div className="grid gap-4 rounded-md border bg-muted/30 p-2 md:grid-cols-[280px_1fr] md:gap-0">
          <div className="flex flex-col gap-1.5 md:max-h-[640px] md:overflow-y-auto md:border-r md:p-2">
            {effectiveMode === "create" && !readOnly ? (
              <div className="rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                <p className="font-medium">{copy.createTitle}</p>
                <p className="text-primary/70">{copy.formHint}</p>
              </div>
            ) : null}
            {sorted.map((contact) => (
              <ClientContactListRow
                key={contact.id}
                contact={contact}
                selected={
                  listHighlightId === contact.id && effectiveMode !== "create"
                }
                onClick={() => handleSelect(contact.id)}
              />
            ))}
          </div>

          <div className="bg-background md:rounded-r-md md:p-5">
            {!readOnly && effectiveMode === "create" && !isMobile ? (
              <FormPanel
                title={copy.createTitle}
                description={copy.formHint}
                isPending={isPending}
                onCancel={handleCancelForm}
                onSubmit={handleSubmitForm}
                submitLabel={copy.createSubmit}
              >
                <ClientContactForm
                  ref={formRef}
                  onChange={setFormData}
                  disabled={isPending}
                />
              </FormPanel>
            ) : !readOnly &&
              effectiveMode === "edit" &&
              (selectedId ?? resolvedViewId) &&
              !isMobile ? (
              editFormDefaults ? (
                <FormPanel
                  title={copy.editTitle}
                  description={copy.formHint}
                  isPending={isPending}
                  onCancel={handleCancelForm}
                  onSubmit={handleSubmitForm}
                  submitLabel={copy.updateSubmit}
                >
                  <ClientContactForm
                    key={selectedId ?? resolvedViewId ?? "edit"}
                    ref={formRef}
                    defaultValues={editFormDefaults}
                    onChange={setFormData}
                    disabled={isPending}
                  />
                </FormPanel>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            ) : effectiveMode === "view" && selectedContact ? (
              <ClientContactDetailView
                contact={selectedContact}
                readOnly={readOnly}
                onSetPrimary={readOnly ? undefined : handleSetPrimary}
                onEdit={readOnly ? undefined : handleStartEdit}
                onDelete={
                  readOnly
                    ? undefined
                    : () => {
                        if (selectedContact) setPendingDelete(selectedContact);
                      }
                }
                isPending={isPending}
              />
            ) : !readOnly &&
              (effectiveMode === "create" || effectiveMode === "edit") &&
              isMobile ? (
              <div className="flex items-center justify-center rounded-md border border-dashed py-12 text-sm text-muted-foreground">
                Formulario abierto en panel inferior.
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Selecciona un contacto de la lista o crea uno nuevo.
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet
        open={
          !readOnly &&
          isMobile &&
          (effectiveMode === "create" || effectiveMode === "edit")
        }
        onOpenChange={(open) => {
          if (!open) handleCancelForm();
        }}
      >
        <SheetContent side="bottom" className="h-[92vh] overflow-hidden p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>
              {effectiveMode === "create" ? copy.createTitle : copy.editTitle}
            </SheetTitle>
            <SheetDescription>{copy.formHint}</SheetDescription>
          </SheetHeader>
          <div className="h-[calc(92vh-132px)] overflow-y-auto px-5 py-4">
            {effectiveMode === "create" ? (
              <ClientContactForm
                ref={formRef}
                onChange={setFormData}
                disabled={isPending}
              />
            ) : editFormDefaults ? (
              <ClientContactForm
                key={selectedId ?? resolvedViewId ?? "mobile-edit"}
                ref={formRef}
                defaultValues={editFormDefaults}
                onChange={setFormData}
                disabled={isPending}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <SheetFooter className="border-t bg-background px-5 py-4">
            <Button variant="outline" onClick={handleCancelForm} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitForm} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : effectiveMode === "create" ? (
                copy.createSubmit
              ) : (
                copy.updateSubmit
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!readOnly && pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescription(pendingDelete?.fullName ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface FormPanelProps {
  title: string;
  description?: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
}

function FormPanel({
  title,
  description,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
  children,
}: FormPanelProps) {
  return (
    <div className="flex flex-col">
      <header className="mb-4 border-b pb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="min-w-0">{children}</div>
      <footer className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </footer>
    </div>
  );
}

export default ClientContactsMasterDetail;
