"use client";

import { useTransition } from "react";
import { useToast } from "@/components/Toast";
import { PendingButton } from "@/components/PendingButton";
import type { ActionResult } from "@/lib/action-result";

export function SubscribeButton({
  action,
  label,
}: {
  action: () => Promise<ActionResult>;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function handleClick() {
    startTransition(async () => {
      const result = await action();
      if (!result.success) showToast("error", result.error);
    });
  }

  return (
    <PendingButton type="button" pending={pending} pendingLabel="Redirection en cours..." onClick={handleClick}>
      {label}
    </PendingButton>
  );
}
