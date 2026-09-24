"use server";

import { createAdminClient } from "@/lib/supabase-admin";

export async function supprimerBusiness(businessId: string) {
  const supabase = createAdminClient();

  // 1. Récupérer les IDs des rendez-vous pour nettoyer reminder_logs
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", businessId);

  if (appointments && appointments.length > 0) {
    const appointmentIds = appointments.map((a) => a.id);
    await supabase.from("reminder_logs").delete().in("appointment_id", appointmentIds);
  }

  // 2. Supprimer dans l'ordre des dépendances
  const { error: errAppointments } = await supabase
    .from("appointments")
    .delete()
    .eq("business_id", businessId);
  if (errAppointments) return { error: "Erreur suppression rendez-vous: " + errAppointments.message };

  const { error: errServices } = await supabase
    .from("services")
    .delete()
    .eq("business_id", businessId);
  if (errServices) return { error: "Erreur suppression services: " + errServices.message };

  const { error: errPayments } = await supabase
    .from("subscription_payments")
    .delete()
    .eq("business_id", businessId);
  if (errPayments) return { error: "Erreur suppression paiements: " + errPayments.message };

  const { error: errHours } = await supabase
    .from("business_hours")
    .delete()
    .eq("business_id", businessId);
  if (errHours) return { error: "Erreur suppression horaires: " + errHours.message };

  // 3. Récupérer le business pour supprimer aussi le compte auth lié
  const { data: business } = await supabase
    .from("businesses")
    .select("user_id")
    .eq("id", businessId)
    .single();

  const { error: errBusiness } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);
  if (errBusiness) return { error: "Erreur suppression commerce: " + errBusiness.message };

  // 4. Supprimer le compte de connexion associé (optionnel, à adapter si pas de user_id)
  if (business?.user_id) {
    await supabase.auth.admin.deleteUser(business.user_id);
  }

  return { success: true };
}