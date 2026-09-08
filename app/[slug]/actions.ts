"use server";

import { createClient } from "@/lib/supabase-server";

export interface ReservationInput {
  businessId: string;
  serviceId: string;
  dureeMinutes: number;
  dateHeure: string;
  clientNom: string;
  clientTelephone: string;
}

export interface ReservationResult {
  success: boolean;
  error?: string;
  appointmentId?: string;
}

export async function creerReservation(
  input: ReservationInput
): Promise<ReservationResult> {
  const supabase = createClient();

  console.log("=== DEBUT RESERVATION ===");
  console.log("Input recu:", JSON.stringify(input));

  if (!input.clientNom.trim() || !input.clientTelephone.trim()) {
    return { success: false, error: "Nom et téléphone sont obligatoires." };
  }

  const debut = new Date(input.dateHeure);
  const fin = new Date(debut.getTime() + input.dureeMinutes * 60000);

  const { data: conflits, error: erreurConflits } = await supabase
    .from("appointments")
    .select("id, date_heure, duree_minutes")
    .eq("business_id", input.businessId)
    .eq("statut", "confirme")
    .gte("date_heure", new Date(debut.getTime() - 4 * 60 * 60000).toISOString())
    .lte("date_heure", fin.toISOString());

  if (erreurConflits) {
    console.log("ERREUR lors de la verification des conflits:", JSON.stringify(erreurConflits));
    return { success: false, error: `Erreur conflits: ${erreurConflits.message}` };
  }

  console.log("Conflits trouves:", JSON.stringify(conflits));

  const dejaPris = (conflits ?? []).some((rdv) => {
    const debutRdv = new Date(rdv.date_heure);
    const finRdv = new Date(debutRdv.getTime() + rdv.duree_minutes * 60000);
    return debut < finRdv && fin > debutRdv;
  });

  if (dejaPris) {
    return {
      success: false,
      error: "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.",
    };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      business_id: input.businessId,
      service_id: input.serviceId,
      client_nom: input.clientNom.trim(),
      client_telephone: input.clientTelephone.trim(),
      date_heure: debut.toISOString(),
      duree_minutes: input.dureeMinutes,
      statut: "confirme",
    })
    .select("id")
    .single();

  if (error) {
    console.log("ERREUR INSERTION:", JSON.stringify(error));
    console.log("Message:", error.message);
    console.log("Code:", error.code);
    console.log("Details:", error.details);
    console.log("Hint:", error.hint);
    return { success: false, error: `Erreur insertion: ${error.message} (code: ${error.code})` };
  }

  console.log("=== RESERVATION REUSSIE ===", data);
  return { success: true, appointmentId: data.id };
}