"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import type { ActionResult } from "@/lib/action-result";

export function ToggleServiceButton({
  serviceId,
  actif,
  action,
}: {
  serviceId: string;
  actif: boolean;
  action: (serviceId: string, actif: boolean) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function handleClick() {
    startTransition(async () => {
      const result = await action(serviceId, actif);
      if (!result.success) showToast("error", result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      className={`dash-badge dash-badge-clickable ${actif ? "dash-badge-confirme" : "dash-badge-termine"}`}
    >
      {pending ? "..." : actif ? "Actif" : "Inactif"}
    </button>
  );
}

export function DeleteServiceButton({
  serviceId,
  action,
}: {
  serviceId: string;
  action: (serviceId: string) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState(false);
  const showToast = useToast();

  function handleClick() {
    if (!confirmation) {
      setConfirmation(true);
      window.setTimeout(() => setConfirmation(false), 3000);
      return;
    }
    startTransition(async () => {
      const result = await action(serviceId);
      if (!result.success) {
        showToast("error", result.error);
        setConfirmation(false);
      } else {
        showToast("success", "Service supprime.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      className={`dash-btn-text dash-btn-text-danger ${confirmation ? "dash-btn-text-confirm" : ""}`}
    >
      {pending ? "Suppression..." : confirmation ? "Confirmer ?" : "Supprimer"}
    </button>
  );
}
