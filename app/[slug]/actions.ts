"use server";

import { createClient } from "@/lib/supabase-server";
import { disponibilitesSchema, reservationSchema } from "@/lib/validation";
import { ipClient, limiteAtteinte } from "@/lib/rate-limit";

export interface ReservationInput {
  slug: string;
  serviceId: string;
  date: string;
  heure: string;
  clientNom: string;
  clientTelephone: string;
}

export interface ReservationResult {
  success: boolean;
  error?: string;
  appointmentId?: string;
}

export interface CreneauPublic {
  heure: string;
  disponible: boolean;
}

export async function chargerCreneauxPublics(input: {
  slug: string;
  serviceId: string;
  date: string;
}): Promise<{ success: boolean; creneaux: CreneauPublic[]; error?: string }> {
  const resultat = disponibilitesSchema.safeParse(input);
  if (!resultat.success) {
    return { success: false, creneaux: [], error: "La date ou le service est invalide." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("lister_creneaux_publics", {
    p_slug: resultat.data.slug,
    p_service_id: resultat.data.serviceId,
    p_date: resultat.data.date,
  });

  if (error) {
    console.error("Erreur de chargement des creneaux:", error.code);
    return { success: false, creneaux: [], error: "Les disponibilites sont temporairement indisponibles." };
  }

  return { success: true, creneaux: (data ?? []) as CreneauPublic[] };
}

/**
 * Crée un rendez-vous. Revérifie la disponibilité côté serveur
 * juste avant l'insertion pour éviter les doubles réservations
 * (deux personnes qui cliquent sur le même créneau en même temps).
 */
export async function creerReservation(
  input: ReservationInput
): Promise<ReservationResult> {
  if (limiteAtteinte(`reservation:${ipClient()}`, 5, 10 * 60_000)) {
    return { success: false, error: "Trop de tentatives. Réessaie dans quelques minutes." };
  }

  const resultat = reservationSchema.safeParse(input);
  if (!resultat.success) {
    return { success: false, error: resultat.error.issues[0]?.message ?? "Les informations sont invalides." };
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc("creer_reservation_publique", {
    p_slug: resultat.data.slug,
    p_service_id: resultat.data.serviceId,
    p_date: resultat.data.date,
    p_heure: resultat.data.heure,
    p_client_nom: resultat.data.clientNom,
    p_client_telephone: resultat.data.clientTelephone,
  });

  if (error) {
    console.error("Erreur de reservation:", error.code);
    return {
      success: false,
      error: error.message.includes("SLOT_UNAVAILABLE")
        ? "Ce creneau vient d'etre reserve. Merci d'en choisir un autre."
        : "La reservation n'a pas pu etre confirmee. Reessaie.",
    };
  }

  return { success: true, appointmentId: data };
}