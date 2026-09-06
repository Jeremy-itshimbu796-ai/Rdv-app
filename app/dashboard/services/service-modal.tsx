"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { PendingButton } from "@/components/PendingButton";
import { useToast } from "@/components/Toast";
import type { ActionResult } from "@/lib/action-result";

export type ServiceInitial = {
  nom: string;
  prix: number;
  duree_minutes: number;
  description: string | null;
  date_fin: string | null;
  actif: boolean;
};

export function ServiceModal({
  titre,
  initial,
  onFermer,
  onSuccess,
  submit,
}: {
  titre: string;
  initial?: ServiceInitial;
  onFermer: () => void;
  onSuccess: () => void;
  submit: (formData: FormData) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [nom, setNom] = useState(initial?.nom ?? "");
  const showToast = useToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErreur(null);
    startTransition(async () => {
      const result = await submit(formData);
      if (result.success) {
        showToast("success", initial ? "Service mis a jour." : "Service ajoute avec succes.");
        onSuccess();
      } else {
        setErreur(result.error);
        showToast("error", result.error);
      }
    });
  }

  return (
    <Modal titre={titre} onFermer={onFermer}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="nom">Nom du service</label>
          <input
            id="nom"
            name="nom"
            required
            placeholder="Ex: Coupe & soin"
            className="form-input"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="form-input form-textarea"
            defaultValue={initial?.description ?? ""}
            placeholder="Optionnel"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="prix">Prix (USD)</label>
          <input id="prix" name="prix" type="number" min="0" step="0.01" required defaultValue={initial?.prix} placeholder="25" className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="duree">Duree (minutes)</label>
          <input id="duree" name="duree" type="number" min="5" step="5" defaultValue={initial?.duree_minutes ?? 30} required className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="date_fin">Fin de disponibilite</label>
          <input id="date_fin" name="date_fin" type="date" defaultValue={initial?.date_fin?.slice(0, 10) ?? ""} className="form-input" />
        </div>
        <label className="service-modal-visible">
          <input type="checkbox" name="visible" defaultChecked={initial?.actif ?? true} />
          Visible sur la page de reservation
        </label>

        {erreur && <p className="form-error" role="alert">{erreur}</p>}

        <PendingButton pending={pending} disabled={!nom.trim()} pendingLabel="Enregistrement..." className="dash-btn service-form-submit">
          {initial ? "Enregistrer" : "+ Ajouter"}
        </PendingButton>
      </form>
    </Modal>
  );
}
