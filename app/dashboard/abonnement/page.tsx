import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { commencerPaiement } from "./actions";
import { SubscribeButton } from "./subscribe-button";

const formatterMontant = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
});

export default async function AbonnementPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/connexion");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan, trial_ends_at")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) redirect("/auth/inscription");

  const { data: paiements } = await supabase
    .from("subscription_payments")
    .select("id, montant, devise, statut, methode_paiement, periode_fin, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const paiementActif = paiements?.find((paiement) =>
    paiement.statut === "successful" && paiement.periode_fin && new Date(paiement.periode_fin) > new Date(),
  );
  const statut = paiementActif ? "Actif" : business.plan === "trial" ? "Essai gratuit" : "Inactif";

  return (
    <div className="subscription-page">
      <div className="subscription-heading">
        <div>
          <h1>Abonnement</h1>
          <p>Gardez votre page de reservation et vos rappels WhatsApp actifs.</p>
        </div>
        <span className={`dash-badge ${paiementActif ? "dash-badge-confirme" : "dash-badge-termine"}`}>{statut}</span>
      </div>

      <section className="subscription-plan">
        <div>
          <span className="eyebrow">Formule unique</span>
          <h2>TonApp Pro</h2>
          <p>Reservations en ligne, rappels WhatsApp et gestion de votre agenda.</p>
        </div>
        <div className="subscription-price"><strong>20 $</strong><span>/ mois</span></div>
        <SubscribeButton action={commencerPaiement} label={paiementActif ? "Renouveler pour un mois" : "Activer mon abonnement"} />
      </section>

      {paiementActif?.periode_fin && (
        <p className="subscription-renewal">Votre acces est actif jusqu'au {new Date(paiementActif.periode_fin).toLocaleDateString("fr-FR")}.</p>
      )}

      <section className="subscription-history">
        <h2>Historique des paiements</h2>
        {!paiements?.length ? (
          <div className="dash-empty">Aucun paiement enregistre pour le moment.</div>
        ) : (
          <div className="subscription-table-wrap">
            <table className="dash-table">
              <thead><tr><th>Date</th><th>Montant</th><th>Methode</th><th>Statut</th></tr></thead>
              <tbody>
                {paiements.map((paiement) => (
                  <tr key={paiement.id}>
                    <td>{new Date(paiement.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="mono">{formatterMontant.format(paiement.montant)}</td>
                    <td>{paiement.methode_paiement ?? "En attente"}</td>
                    <td><span className={`dash-badge ${paiement.statut === "successful" ? "dash-badge-confirme" : paiement.statut === "failed" ? "dash-badge-annule" : "dash-badge-termine"}`}>{paiement.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}