"use client";

import { useState } from "react";
import { ServiceModal } from "./service-modal";
import { ToggleServiceButton, DeleteServiceButton } from "./service-row-actions";
import type { ActionResult } from "@/lib/action-result";

type Service = {
  id: string;
  nom: string;
  prix: number;
  duree_minutes: number;
  description: string | null;
  date_fin: string | null;
  actif: boolean;
};

export function ServicesManager({
  services,
  ajouterService,
  modifierService,
  toggleService,
  supprimerService,
}: {
  services: Service[];
  ajouterService: (formData: FormData) => Promise<ActionResult>;
  modifierService: (serviceId: string, formData: FormData) => Promise<ActionResult>;
  toggleService: (serviceId: string, actif: boolean) => Promise<ActionResult>;
  supprimerService: (serviceId: string) => Promise<ActionResult>;
}) {
  const [modeAjout, setModeAjout] = useState(false);
  const [serviceEnEdition, setServiceEnEdition] = useState<Service | null>(null);

  return (
    <div>
      <div className="page-heading page-heading-row">
        <div>
          <h1>Mes services</h1>
          <p className="page-subtitle">
            {services.length} service{services.length > 1 ? "s" : ""} proposé{services.length > 1 ? "s" : ""}
          </p>
        </div>
        <button type="button" className="dash-btn" onClick={() => setModeAjout(true)}>
          + Ajouter une prestation
        </button>
      </div>

      {!services.length ? (
        <div className="dash-empty dash-empty-bordered">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="dash-empty-icon">
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
          </svg>
          <div className="dash-empty-title">Aucun service proposé pour le moment.</div>
          <div className="dash-empty-hint">Ajoutez votre premier service pour commencer à recevoir des réservations.</div>
        </div>
      ) : (
        <div className="dash-table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Prix</th>
                <th>Durée</th>
                <th>Fin</th>
                <th>Statut</th>
                <th className="dash-table-actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="dash-table-strong">{s.nom}</td>
                  <td className="mono">{s.prix}$</td>
                  <td className="mono">{s.duree_minutes} min</td>
                  <td className="mono">{s.date_fin ? new Date(s.date_fin).toLocaleDateString("fr-FR") : "—"}</td>
                  <td>
                    <ToggleServiceButton serviceId={s.id} actif={s.actif} action={toggleService} />
                  </td>
                  <td className="dash-table-actions-cell">
                    <div className="rdv-row-actions">
                      <button type="button" className="dash-btn-text" onClick={() => setServiceEnEdition(s)}>
                        Modifier
                      </button>
                      <DeleteServiceButton serviceId={s.id} action={supprimerService} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modeAjout && (
        <ServiceModal
          titre="Ajouter une prestation"
          onFermer={() => setModeAjout(false)}
          onSuccess={() => setModeAjout(false)}
          submit={ajouterService}
        />
      )}

      {serviceEnEdition && (
        <ServiceModal
          titre="Modifier la prestation"
          initial={serviceEnEdition}
          onFermer={() => setServiceEnEdition(null)}
          onSuccess={() => setServiceEnEdition(null)}
          submit={(formData) => modifierService(serviceEnEdition.id, formData)}
        />
      )}
    </div>
  );
}
