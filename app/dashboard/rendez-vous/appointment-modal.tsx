"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import type { ActionResult } from "@/lib/action-result";

type Appointment = {
  id: string;
  client_nom: string;
  client_telephone: string;
  date_heure: string;
  statut: string;
  services?: { nom: string } | null;
};

export function AppointmentDetailButton({
  appointment,
  filtre,
  action,
}: {
  appointment: Appointment;
  filtre: string;
  action: (appointmentId: string, statut: string) => Promise<ActionResult>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [confirmationAnnulation, setConfirmationAnnulation] = useState(false);
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function fermer() {
    setOuvert(false);
    setConfirmationAnnulation(false);
  }

  function appliquer(statut: string, messageSucces: string) {
    startTransition(async () => {
      const result = await action(appointment.id, statut);
      if (result.success) {
        showToast("success", messageSucces);
        fermer();
      } else {
        showToast("error", result.error);
        setConfirmationAnnulation(false);
      }
    });
  }

  const heureFr = new Date(appointment.date_heure).toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const numeroWhatsapp = appointment.client_telephone.replace(/[^\d+]/g, "");

  return (
    <>
      <button type="button" className="dash-btn-text" onClick={() => setOuvert(true)}>
        Gérer
      </button>

      {ouvert && (
        <Modal titre="Détails du rendez-vous" onFermer={fermer}>
          <div className="appt-modal-details">
            <div className="appt-modal-row">
              <span className="appt-modal-label">Client</span>
              <span>{appointment.client_nom}</span>
            </div>
            <div className="appt-modal-row">
              <span className="appt-modal-label">Téléphone</span>
              <a href={`https://wa.me/${numeroWhatsapp}`} target="_blank" rel="noopener noreferrer" className="mono">
                {appointment.client_telephone}
              </a>
            </div>
            <div className="appt-modal-row">
              <span className="appt-modal-label">Service</span>
              <span>{appointment.services?.nom ?? "-"}</span>
            </div>
            <div className="appt-modal-row">
              <span className="appt-modal-label">Date</span>
              <span className="mono">{heureFr}</span>
            </div>
            <div className="appt-modal-row">
              <span className="appt-modal-label">Statut</span>
              <span className={`dash-badge ${appointment.statut === "confirme" ? "dash-badge-confirme" : appointment.statut === "annule" ? "dash-badge-annule" : "dash-badge-termine"}`}>
                {appointment.statut}
              </span>
            </div>
          </div>

          <div className="appt-modal-actions">
            {appointment.statut === "confirme" && filtre === "passes" && (
              <>
                <button type="button" disabled={pending} className="dash-btn-text" onClick={() => appliquer("termine", "Rendez-vous marque comme termine.")}>
                  Marquer comme terminé
                </button>
                <button type="button" disabled={pending} className="dash-btn-text dash-btn-text-danger" onClick={() => appliquer("no_show", "Rendez-vous marque absent.")}>
                  Marquer absent
                </button>
              </>
            )}
            {appointment.statut === "confirme" && filtre === "a_venir" && (
              <button
                type="button"
                disabled={pending}
                className={`dash-btn-text dash-btn-text-danger ${confirmationAnnulation ? "dash-btn-text-confirm" : ""}`}
                onClick={() => {
                  if (!confirmationAnnulation) {
                    setConfirmationAnnulation(true);
                    return;
                  }
                  appliquer("annule", "Rendez-vous annule.");
                }}
              >
                {pending ? "Annulation..." : confirmationAnnulation ? "Confirmer l'annulation ?" : "Annuler le rendez-vous"}
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
