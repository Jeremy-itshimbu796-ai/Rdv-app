"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import { PendingButton } from "@/components/PendingButton";
import type { ActionResult } from "@/lib/action-result";

type HoraireJour = { ferme: boolean; heure_ouverture: string; heure_fermeture: string };

export function ScheduleForm({
  jours,
  horaires,
  action,
}: {
  jours: readonly string[];
  horaires: HoraireJour[];
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
      if (result.success) showToast("success", "Horaires enregistres.");
      else {
        setErreur(result.error);
        showToast("error", result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {jours.map((nomJour, jour) => {
        const h = horaires[jour];
        return (
          <div key={jour} className={`schedule-row ${jour > 0 ? "schedule-row-divider" : ""}`}>
            <div className="schedule-day-name">{nomJour}</div>

            <label className="schedule-closed-toggle">
              <input type="checkbox" name={`ferme_${jour}`} defaultChecked={h.ferme} />
              Ferme
            </label>

            <input type="time" name={`ouverture_${jour}`} defaultValue={h.heure_ouverture?.slice(0, 5)} className="form-input schedule-time-input" />
            <span className="schedule-arrow">-&gt;</span>
            <input type="time" name={`fermeture_${jour}`} defaultValue={h.heure_fermeture?.slice(0, 5)} className="form-input schedule-time-input" />
          </div>
        );
      })}

      {erreur && <p className="form-error" role="alert">{erreur}</p>}

      <PendingButton pending={pending} pendingLabel="Enregistrement..." className="dash-btn schedule-submit">
        Enregistrer les horaires
      </PendingButton>
    </form>
  );
}
