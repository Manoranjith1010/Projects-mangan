"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, FormError } from "@/components/ui";

type State = { error?: string; ok?: string };

function SubmitButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? "Working…" : children}
    </Button>
  );
}

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className,
  onSuccess,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, {});
  React.useEffect(() => {
    if (state.ok && onSuccess) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-3 flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        {state.ok && <span className="text-sm text-green-600">{state.ok}</span>}
      </div>
      <FormError>{state.error}</FormError>
    </form>
  );
}

export { SubmitButton };
