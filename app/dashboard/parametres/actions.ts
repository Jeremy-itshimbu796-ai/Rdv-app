"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { businessSchema, horaireSchema } from "@/lib/validation";
import { type ActionResult, ACTION_OK, actionError } from "@/lib/action-result";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export async function mettreAJourBusiness(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Votre session a expire. Reconnectez-vous.");

  const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) return actionError("Votre espace professionnel est introuvable.");

  const validation = businessSchema.safeParse({
    nom: formData.get("nom"),
    telephone: formData.get("telephone"),
    adresse: String(formData.get("adresse") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!validation.success) {
    return actionError(validation.error.issues[0]?.message ?? "Les informations saisies sont invalides.");
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      nom: validation.data.nom,
      telephone: validation.data.telephone,
      adresse: validation.data.adresse || null,
      description: validation.data.description || null,
    })
    .eq("id", business.id);
  if (error) return actionError("Impossible d'enregistrer ces informations. Veuillez reessayer.");

  revalidatePath("/dashboard/parametres");
  revalidatePath("/dashboard");
  return ACTION_OK;
}

export async function mettreAJourHoraires(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Votre session a expire. Reconnectez-vous.");

  const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) return actionError("Votre espace professionnel est introuvable.");

  const horaires: {
    business_id: string;
    jour_semaine: number;
    ferme: boolean;
    heure_ouverture: string;
    heure_fermeture: string;
  }[] = [];

  for (let jour = 0; jour < 7; jour++) {
    const validation = horaireSchema.safeParse({
      ferme: formData.get(`ferme_${jour}`) === "on",
      ouverture: String(formData.get(`ouverture_${jour}`) ?? "09:00"),
      fermeture: String(formData.get(`fermeture_${jour}`) ?? "18:00"),
    });
    if (!validation.success) {
      return actionError(`${validation.error.issues[0]?.message ?? "Horaire invalide"} (${JOURS[jour]}).`);
    }
    horaires.push({
      business_id: business.id,
      jour_semaine: jour,
      ferme: validation.data.ferme,
      heure_ouverture: validation.data.ouverture,
      heure_fermeture: validation.data.fermeture,
    });
  }

  const { data: horairesExistants, error: horairesError } = await supabase
    .from("business_hours")
    .select("id, jour_semaine")
    .eq("business_id", business.id);
  if (horairesError) return actionError("Impossible de lire les horaires existants.");

  const identifiantsParJour = new Map(horairesExistants?.map((horaire) => [horaire.jour_semaine, horaire.id]));
  for (const horaire of horaires) {
    const identifiant = identifiantsParJour.get(horaire.jour_semaine);
    const { error } = identifiant
      ? await supabase.from("business_hours").update(horaire).eq("id", identifiant)
      : await supabase.from("business_hours").insert(horaire);
    if (error) return actionError("Impossible d'enregistrer les horaires. Veuillez reessayer.");
  }

  revalidatePath("/dashboard/parametres");
  return ACTION_OK;
}

export async function mettreAJourImageBusiness(kind: "logo" | "banniere", url: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Votre session a expire. Reconnectez-vous.");

  const { data: business } = await supabase.from("businesses").select("id, slug").eq("owner_id", user.id).single();
  if (!business) return actionError("Votre espace professionnel est introuvable.");

  const colonne = kind === "logo" ? "logo_url" : "banniere_url";
  const { error } = await supabase.from("businesses").update({ [colonne]: url }).eq("id", business.id);
  if (error) return actionError("Impossible d'enregistrer l'image. Veuillez reessayer.");

  revalidatePath("/dashboard/parametres");
  revalidatePath(`/${business.slug}`);
  return ACTION_OK;
}