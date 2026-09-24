"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

export async function creerBusiness(formData: FormData) {
  const nom = formData.get("nom") as string;
  const slug = formData.get("slug") as string;
  const telephone = formData.get("telephone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const plan = formData.get("plan") as string;

  const supabase = createAdminClient();

  // 1. Créer le compte de connexion
  const { data: authUser, error: errAuth } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (errAuth || !authUser.user) {
    throw new Error("Erreur création du compte: " + errAuth?.message);
  }

  // 2. Créer la fiche business liée
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const { data: business, error: errBusiness } = await supabase
    .from("businesses")
    .insert({
      nom,
      slug,
      telephone,
      email,
      plan,
      trial_ends_at: plan === "essai" ? trialEndsAt.toISOString() : null,
      user_id: authUser.user.id,
    })
    .select("id")
    .single();

  if (errBusiness) {
    // Rollback: supprimer le compte auth créé si l'insert business échoue
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error("Erreur création du commerce: " + errBusiness.message);
  }

  redirect(`/admin/businesses/${business.id}`);
}