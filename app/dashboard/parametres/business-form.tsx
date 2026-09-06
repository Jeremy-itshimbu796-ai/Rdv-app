"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import { PendingButton } from "@/components/PendingButton";
import type { ActionResult } from "@/lib/action-result";

export function BusinessForm({
  business,
  action,
}: {
  business: { nom: string; telephone: string; adresse: string | null; description: string | null };
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const showToast = useToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErreur(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result.success) showToast("success", "Informations enregistrees.");
      else {
        setErreur(result.error);
        showToast("error", result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="nom">Nom de l'activite</label>
        <input id="nom" name="nom" defaultValue={business.nom} required className="form-input" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="telephone">Numero WhatsApp</label>
        <input id="telephone" name="telephone" defaultValue={business.telephone} required className="form-input" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="adresse">Adresse</label>
        <input id="adresse" name="adresse" defaultValue={business.adresse ?? ""} className="form-input" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={business.description ?? ""} rows={3} className="form-input form-textarea" />
      </div>

      {erreur && <p className="form-error" role="alert">{erreur}</p>}

      <PendingButton pending={pending} pendingLabel="Enregistrement...">Enregistrer</PendingButton>
    </form>
  );
}
