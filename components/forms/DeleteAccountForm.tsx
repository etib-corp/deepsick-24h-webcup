"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button as ShadcnButton } from "@/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { Alert } from "@/components/ui/Alert";
import { Field, Input } from "@/components/ui/Field";
import { deleteAccountAction } from "@/lib/actions/account";
import { initialActionState } from "@/lib/action-state";
import { signOutTo } from "@/lib/client-sign-out";
import { useT } from "@/lib/i18n/client";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <ShadcnButton
      type="submit"
      variant="destructive"
      disabled={disabled || pending}
      className="font-mono uppercase tracking-wide"
    >
      {pending ? t.citizen.account.pending : t.citizen.account.confirmButton}
    </ShadcnButton>
  );
}

export function DeleteAccountForm() {
  const t = useT();
  const [state, formAction] = useFormState(deleteAccountAction, initialActionState);
  const [confirmValue, setConfirmValue] = useState("");
  const [open, setOpen] = useState(false);

  const ready = confirmValue.trim() === t.citizen.account.confirmPhrase;

  // The account is gone: end the session on the current host and land on the
  // confirmation message — without a NextAuth server redirect, which would
  // resolve against NEXTAUTH_URL and could point at another host.
  useEffect(() => {
    if (state.ok) void signOutTo("/login?deleted=1");
  }, [state.ok]);

  return (
    <div className="space-y-3">
      {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <ShadcnButton
            type="button"
            variant="destructive"
            className="font-mono uppercase tracking-wide"
          >
            {t.citizen.account.deleteButton}
          </ShadcnButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">{t.citizen.account.dialogTitle}</DialogTitle>
            <DialogDescription>{t.citizen.account.dialogText}</DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <Field label={t.citizen.account.confirmLabel} htmlFor="account-delete-confirm">
              <Input
                id="account-delete-confirm"
                name="confirm"
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>

            <DialogFooter>
              <DialogClose asChild>
                <ShadcnButton type="button" variant="outline" className="font-mono uppercase tracking-wide">
                  {t.citizen.account.cancel}
                </ShadcnButton>
              </DialogClose>
              <SubmitButton disabled={!ready} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
