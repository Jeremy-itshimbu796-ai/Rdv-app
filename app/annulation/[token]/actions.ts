"use server";

import { createClient } from "@/lib/supabase-server";
import { cancellationTokenSchema } from "@/lib/validation";
import { ipClient, limiteAtteinte } from "@/lib/rate-limit";

export async function annulerReservation(token: string): Promise<{ success: boolean; error?: string }> {
  if (limiteAtteinte(`annulation:${ipClient()}`, 10, 10 * 60_000)) {
    return { success: false, error: "Trop de tentatives. Réessaie dans quelques minutes." };
  }

  const validation = cancellationTokenSchema.safeParse(token);
  if (!validation.success) {
    return { success: false, error: "Ce lien d'annulation est invalide." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("annuler_reservation_publique", {
    p_token: validation.data,
  });

  if (error) {
    console.error("Erreur d'annulation:", error.code);
    return { success: false, error: "L'annulation est temporairement indisponible. Reessaie." };
  }

  if (!data) {
    return { success: false, error: "Ce rendez-vous ne peut plus etre annule." };
  }

  return { success: true };
}
