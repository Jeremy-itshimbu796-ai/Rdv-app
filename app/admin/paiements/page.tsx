import { createAdminClient } from "@/lib/supabase-admin";

export default async function AdminPaiementsPage() {
  const supabase = createAdminClient();

  const { data: paiements } = await supabase
    .from("subscription_payments")
    .select("id, montant, devise, statut, plan_id, methode_paiement, created_at, business_id, businesses(nom)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1>Historique des paiements</h1>

      {!paiements?.length ? (
        <div className="dash-empty">Aucun paiement enregistré.</div>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Commerce</th>
              <th>Formule</th>
              <th>Montant</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p: any) => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                <td>{p.businesses?.nom ?? "—"}</td>
                <td>{p.plan_id ?? "—"}</td>
                <td className="mono">{p.montant} {p.devise}</td>
                <td>
                  <span className={`dash-badge ${p.statut === "successful" ? "dash-badge-confirme" : p.statut === "failed" ? "dash-badge-annule" : "dash-badge-termine"}`}>
                    {p.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}