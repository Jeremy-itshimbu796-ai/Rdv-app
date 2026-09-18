import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { commencerPaiement } from "./actions";
import { SubscribeButton } from "./subscribe-button";

const formatterMontant = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
});

const PLANS = [
  {
    id: "basique",
    nom: "Essentiel",
    prix: 10,
    description: "Pour démarrer avec une gestion simple de vos rendez-vous.",
    avantages: [
      "Page de réservation en ligne illimitée",
      "Gestion des services et des horaires",
      "Rappel manuel (vous envoyez vous-même)",
      "Tableau de bord complet",
    ],
    populaire: false,
  },
  {
    id: "pro",
    nom: "Pro",
    prix: 20,
    description: "Pour ne plus jamais penser aux rappels — tout est automatique.",
    avantages: [
      "Tout ce qui est inclus dans Essentiel",
      "Rappel WhatsApp automatique (24h et 1h avant)",
      "Réduction des rendez-vous manqués",
      "Support prioritaire",
    ],
    populaire: true,
  },
] as const;

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
    .select("id, montant, devise, statut, methode_paiement, periode_fin, plan_id, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const paiementActif = paiements?.find((paiement) =>
    paiement.statut === "successful" && paiement.periode_fin && new Date(paiement.periode_fin) > new Date(),
  );
  const planActifId = paiementActif?.plan_id ?? null;
  const statut = paiementActif ? "Actif" : business.plan === "trial" ? "Essai gratuit" : "Inactif";

  return (
    <div className="subscription-page">
      <div className="subscription-heading">
        <div>
          <h1>Abonnement</h1>
          <p>Gardez votre page de réservation et vos rappels WhatsApp actifs.</p>
        </div>
        <span className={`dash-badge ${paiementActif ? "dash-badge-confirme" : "dash-badge-termine"}`}>{statut}</span>
      </div>

      <section className="subscription-plans-grid">
        {PLANS.map((plan) => {
          const estPlanActif = planActifId === plan.id;
          return (
            <div key={plan.id} className={`subscription-plan-card ${plan.populaire ? "populaire" : ""}`}>
              {plan.populaire && <span className="subscription-badge-populaire">Le plus choisi</span>}

              <span className="eyebrow">{plan.nom}</span>
              <div className="subscription-price">
                <strong>{plan.prix} $</strong><span>/ mois</span>
              </div>
              <p className="subscription-plan-desc">{plan.description}</p>

              <ul className="subscription-avantages">
                {plan.avantages.map((avantage) => (
                  <li key={avantage}>
                    <span className="check-icon">✓</span>
                    {avantage}
                  </li>
                ))}
              </ul>

              <SubscribeButton
                action={() => commencerPaiement(plan.id)}
                label={estPlanActif ? "Renouveler pour un mois" : `Choisir ${plan.nom}`}
              />
            </div>
          );
        })}
      </section>

      {paiementActif?.periode_fin && (
        <p className="subscription-renewal">
          Votre accès est actif jusqu'au {new Date(paiementActif.periode_fin).toLocaleDateString("fr-FR")}.
        </p>
      )}

      <section className="subscription-history">
        <h2>Historique des paiements</h2>
        {!paiements?.length ? (
          <div className="dash-empty">Aucun paiement enregistré pour le moment.</div>
        ) : (
          <div className="subscription-table-wrap">
            <table className="dash-table">
              <thead><tr><th>Date</th><th>Formule</th><th>Montant</th><th>Méthode</th><th>Statut</th></tr></thead>
              <tbody>
                {paiements.map((paiement) => (
                  <tr key={paiement.id}>
                    <td>{new Date(paiement.created_at).toLocaleDateString("fr-FR")}</td>
                    <td>{PLANS.find((p) => p.id === paiement.plan_id)?.nom ?? "—"}</td>
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