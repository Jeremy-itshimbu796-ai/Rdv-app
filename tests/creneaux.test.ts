import assert from "node:assert/strict";
import test from "node:test";
import { calculerCreneauxDisponibles } from "../lib/creneaux";
import type { Appointment, BusinessHour } from "../lib/types";

const horaires: BusinessHour[] = [{
  id: "horaire-1",
  business_id: "business-1",
  jour_semaine: 1,
  heure_ouverture: "09:00",
  heure_fermeture: "10:30",
  ferme: false,
}];

const dateTest = new Date(2030, 0, 7, 12);

const rendezVous: Appointment[] = [{
  id: "rdv-1",
  business_id: "business-1",
  service_id: "service-1",
  client_nom: "Client test",
  client_telephone: "+243810000000",
  date_heure: new Date(2030, 0, 7, 9, 15).toISOString(),
  duree_minutes: 30,
  statut: "confirme",
  notes: null,
}];

test("exclut chaque creneau qui chevauche un rendez-vous confirme", () => {
  const creneaux = calculerCreneauxDisponibles(
    dateTest,
    30,
    horaires,
    rendezVous,
  );

  assert.deepEqual(creneaux.map(({ heure, disponible }) => ({ heure, disponible })), [
    { heure: "09:00", disponible: false },
    { heure: "09:15", disponible: false },
    { heure: "09:30", disponible: false },
    { heure: "09:45", disponible: true },
    { heure: "10:00", disponible: true },
  ]);
});

test("ne produit aucun creneau lorsque le commerce est ferme", () => {
  const creneaux = calculerCreneauxDisponibles(
    dateTest,
    30,
    [{ ...horaires[0], ferme: true }],
    [],
  );

  assert.deepEqual(creneaux, []);
});
