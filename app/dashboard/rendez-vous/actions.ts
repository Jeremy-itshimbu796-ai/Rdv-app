"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { statutRendezVousSchema } from "@/lib/validation";
import { type ActionResult, ACTION_OK, actionError } from "@/lib/action-result";

export async function changerStatut(appointmentId: string, statut: string): Promise<ActionResult> {
  const validation = statutRendezVousSchema.safeParse(statut);
  if (!validation.success) return actionError("Ce statut n'est pas valide.");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Votre session a expire. Reconnectez-vous.");

  const { error } = await supabase.from("appointments").update({ statut: validation.data }).eq("id", appointmentId);
  if (error) return actionError("Impossible de mettre a jour ce rendez-vous.");

  revalidatePath("/dashboard/rendez-vous");
  revalidatePath("/dashboard");
  return ACTION_OK;
}