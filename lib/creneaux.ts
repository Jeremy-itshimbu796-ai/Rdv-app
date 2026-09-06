import type { Appointment, BusinessHour } from "./types";

export interface CreneauDispo {
  heure: string; // format "HH:mm"
  disponible: boolean;
}

/**
 * Calcule les créneaux disponibles pour une date donnée,
 * en fonction des horaires d'ouverture du business et des
 * rendez-vous déjà pris ce jour-là.
 */
export function calculerCreneauxDisponibles(
  date: Date,
  dureeServiceMinutes: number,
  horaires: BusinessHour[],
  rendezVousExistants: Appointment[]
): CreneauDispo[] {
  const jourSemaine = date.getDay();
  const horaireDuJour = horaires.find((h) => h.jour_semaine === jourSemaine);

  if (!horaireDuJour || horaireDuJour.ferme) {
    return [];
  }

  const [heureOuvH, heureOuvM] = horaireDuJour.heure_ouverture.split(":").map(Number);
  const [heureFermH, heureFermM] = horaireDuJour.heure_fermeture.split(":").map(Number);

  const debutJournee = new Date(date);
  debutJournee.setHours(heureOuvH, heureOuvM, 0, 0);

  const finJournee = new Date(date);
  finJournee.setHours(heureFermH, heureFermM, 0, 0);

  // Rendez-vous du jour, triés
  const jourStr = date.toISOString().split("T")[0];
  const rdvDuJour = rendezVousExistants.filter(
    (r) => r.date_heure.startsWith(jourStr) && r.statut === "confirme"
  );

  const creneaux: CreneauDispo[] = [];
  const INTERVALLE_MINUTES = 15; // granularité des créneaux proposés

  let curseur = new Date(debutJournee);

  while (curseur.getTime() + dureeServiceMinutes * 60000 <= finJournee.getTime()) {
    const finCreneau = new Date(curseur.getTime() + dureeServiceMinutes * 60000);

    const chevauche = rdvDuJour.some((rdv) => {
      const debutRdv = new Date(rdv.date_heure);
      const finRdv = new Date(debutRdv.getTime() + rdv.duree_minutes * 60000);
      return curseur < finRdv && finCreneau > debutRdv;
    });

    // Empêche de proposer un créneau déjà passé si la date choisie est aujourd'hui
    const estPasse = curseur.getTime() < Date.now();

    creneaux.push({
      heure: curseur.toTimeString().slice(0, 5),
      disponible: !chevauche && !estPasse,
    });

    curseur = new Date(curseur.getTime() + INTERVALLE_MINUTES * 60000);
  }

  return creneaux;
}
