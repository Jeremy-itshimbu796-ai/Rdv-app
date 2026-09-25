"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supprimerBusiness } from "./actions";

export default function DeleteButton({
  businessId,
  businessNom,
}: {
  businessId: string;
  businessNom: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await supprimerBusiness(businessId);
      if (result?.error) {
        setErreur(result.error);
        setConfirming(false);
      } else {
        router.push("/admin/businesses");
      }
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className="admin-btn admin-btn-danger"
        onClick={() => setConfirming(true)}
      >
        Supprimer
      </button>
    );
  }

  return (
    <div className="admin-confirm-box">
      <p>
        Supprimer <strong>{businessNom}</strong> et toutes ses donnees
        (rendez-vous, services, paiements) ? Cette action est irreversible.
      </p>
      {erreur && <p className="admin-error">{erreur}</p>}
      <div className="admin-confirm-actions">
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? "Suppression..." : "Oui, supprimer"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}