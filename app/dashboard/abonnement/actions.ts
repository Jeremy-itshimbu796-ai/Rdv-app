"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { type ActionResult, actionError } from "@/lib/action-result";

const PRIX_MENSUEL_USD = 20;

function messageErreurChariow(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Le prestataire de paiement est indisponible.";

  const reponse = payload as { message?: unknown; errors?: unknown };
  if (typeof reponse.message === "string" && reponse.message.trim()) return reponse.message;

  if (reponse.errors && typeof reponse.errors === "object") {
    const erreurs = Object.values(reponse.errors as Record<string, unknown>)
      .flatMap((valeur) => Array.isArray(valeur) ? valeur : [valeur])
      .filter((valeur): valeur is string => typeof valeur === "string");
    if (erreurs.length) return erreurs.join(" ");
  }

  return "Le prestataire de paiement est indisponible.";
}

function messageErreurPaiement(error: { code?: string; message: string }): string {
  if (error.code === "PGRST204" || error.message.includes("reference_interne")) {
    return "La migration des paiements Chariow n'est pas encore appliquee dans Supabase.";
  }
  if (error.code === "42501") {
    return "Supabase refuse la creation du paiement. Appliquez la migration Chariow pour activer l'autorisation necessaire.";
  }
  return "Impossible de preparer le paiement. Veuillez reessayer.";
}

export async function commencerPaiement(): Promise<ActionResult> {
  const cleChariow = process.env.CHARIOW_API_KEY;
  const produitChariow = process.env.CHARIOW_PRODUCT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!cleChariow || !produitChariow || !appUrl) {
    return actionError("Le paiement n'est pas encore configure.");
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/connexion");

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, nom, telephone")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (businessError || !business) return actionError("Votre espace professionnel est introuvable.");

  const reference = `tonapp_${business.id}_${randomUUID()}`;
  const { error: paymentError } = await supabase.from("subscription_payments").insert({
    business_id: business.id,
    reference_interne: reference,
    fournisseur: "chariow",
    montant: PRIX_MENSUEL_USD,
    devise: "USD",
  });
  if (paymentError) return actionError(messageErreurPaiement(paymentError));

  const telephone = business.telephone.replace(/\D/g, "");
  const response = await fetch("https://api.chariow.com/v1/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleChariow}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: produitChariow,
      email: user.email,
      first_name: business.nom.slice(0, 50),
      last_name: "TonApp",
      phone: { number: telephone, country_code: "CD" },
      redirect_url: `${appUrl.replace(/\/$/, "")}/dashboard/abonnement?paiement=retour`,
      custom_metadata: { reference_interne: reference, business_id: business.id },
    }),
  });
  const payload = await response.json().catch(() => null);
  const checkout = payload?.data;
  if (!response.ok || checkout?.step !== "payment" || !checkout.payment?.checkout_url || !checkout.purchase?.id) {
    await supabase.from("subscription_payments").update({ statut: "failed" }).eq("reference_interne", reference);
    if (checkout?.step === "already_purchased") {
      return actionError("Ce produit est deja associe a votre compte Chariow. Utilisez un produit de type License pour autoriser les renouvellements.");
    }
    return actionError(messageErreurChariow(payload));
  }

  const { error: updateError } = await supabase
    .from("subscription_payments")
    .update({
      fournisseur_sale_id: checkout.purchase.id,
      fournisseur_payment_id: checkout.payment.transaction_id,
    })
    .eq("reference_interne", reference);
  if (updateError) return actionError("Impossible de finaliser la preparation du paiement.");

  redirect(checkout.payment.checkout_url);
}
