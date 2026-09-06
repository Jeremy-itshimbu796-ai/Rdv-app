"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { serviceSchema } from "@/lib/validation";
import { type ActionResult, ACTION_OK, actionError } from "@/lib/action-result";

async function getBusinessId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
  return business?.id ?? null;
}

export async function ajouterService(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return actionError("Votre session a expire. Reconnectez-vous.");

  const validation = serviceSchema.safeParse({
    nom: formData.get("nom"),
    prix: formData.get("prix"),
    duree: formData.get("duree"),
    dateFin: formData.get("date_fin") ?? "",
    description: formData.get("description") ?? "",
    visible: formData.get("visible") === "on",
  });
  if (!validation.success) {
    return actionError(validation.error.issues[0]?.message ?? "Les informations du service sont invalides.");
  }

  const payload: Record<string, unknown> = {
    business_id: businessId,
    nom: validation.data.nom,
    prix: validation.data.prix,
    duree_minutes: validation.data.duree,
    description: validation.data.description || null,
    actif: validation.data.visible,
  };
  if (validation.data.dateFin) {
    payload.date_fin = new Date(`${validation.data.dateFin}T23:59:59`).toISOString();
  }

  const { error } = await supabase.from("services").insert(payload);
  if (error) {
    console.error("Erreur insertion service:", error);
    return actionError("Impossible d'ajouter ce service. Veuillez reessayer.");
  }

  revalidatePath("/dashboard/services");
  return ACTION_OK;
}

export async function modifierService(serviceId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return actionError("Votre session a expire. Reconnectez-vous.");

  const validation = serviceSchema.safeParse({
    nom: formData.get("nom"),
    prix: formData.get("prix"),
    duree: formData.get("duree"),
    dateFin: formData.get("date_fin") ?? "",
    description: formData.get("description") ?? "",
    visible: formData.get("visible") === "on",
  });
  if (!validation.success) {
    return actionError(validation.error.issues[0]?.message ?? "Les informations du service sont invalides.");
  }

  const payload: Record<string, unknown> = {
    nom: validation.data.nom,
    prix: validation.data.prix,
    duree_minutes: validation.data.duree,
    description: validation.data.description || null,
    actif: validation.data.visible,
    date_fin: validation.data.dateFin ? new Date(`${validation.data.dateFin}T23:59:59`).toISOString() : null,
  };

  const { error } = await supabase.from("services").update(payload).eq("id", serviceId).eq("business_id", businessId);
  if (error) {
    console.error("Erreur modification service:", error);
    return actionError("Impossible de modifier ce service. Veuillez reessayer.");
  }

  revalidatePath("/dashboard/services");
  return ACTION_OK;
}

export async function toggleService(serviceId: string, actif: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return actionError("Votre session a expire. Reconnectez-vous.");

  const { error } = await supabase
    .from("services")
    .update({ actif: !actif })
    .eq("id", serviceId)
    .eq("business_id", businessId);
  if (error) return actionError("Impossible de changer le statut de ce service.");

  revalidatePath("/dashboard/services");
  return ACTION_OK;
}

export async function supprimerService(serviceId: string): Promise<ActionResult> {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return actionError("Votre session a expire. Reconnectez-vous.");

  const { error } = await supabase.from("services").delete().eq("id", serviceId).eq("business_id", businessId);
  if (error) return actionError("Impossible de supprimer ce service.");

  revalidatePath("/dashboard/services");
  return ACTION_OK;
}