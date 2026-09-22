import { createAdminClient } from "@/lib/supabase-admin";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  const { count: totalBusinesses } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true });

  const { count: businessesActifs } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("plan", "active");

  const { count: businessesEssai } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("plan", "trial");

  const { count: totalRendezVous } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true });

  const { data: paiementsReussis } = await supabase
    .from("subscription_payments")
    .select("montant")
    .eq("statut", "successful");

  const revenuTotal = (paiementsReussis ?? []).reduce((somme, p) => somme + Number(p.montant), 0);

  const { data: dernieresInscriptions } = await supabase
    .from("businesses")
    .select("id, nom, slug, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div>
      <h1>Vue d'ensemble</h1>

      <div className="admin-stats-grid">
        <div className="admin-stat-box">
          <span className="admin-stat-label">Commerces inscrits</span>
          <span className="admin-stat-value">{totalBusinesses ?? 0}</span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Abonnements actifs</span>
          <span className="admin-stat-value">{businessesActifs ?? 0}</span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">En essai gratuit</span>
          <span className="admin-stat-value">{businessesEssai ?? 0}</span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Rendez-vous créés (total)</span>
          <span className="admin-stat-value">{totalRendezVous ?? 0}</span>
        </div>
        <div className="admin-stat-box highlight">
          <span className="admin-stat-label">Revenu total encaissé</span>
          <span className="admin-stat-value">{revenuTotal.toFixed(2)} $</span>
        </div>
      </div>

      <h2 style={{ fontSize: 18, margin: "32px 0 16px" }}>Dernières inscriptions</h2>
      {!dernieresInscriptions?.length ? (
        <div className="dash-empty">Aucune inscription pour le moment.</div>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Lien public</th>
              <th>Plan</th>
              <th>Date d'inscription</th>
            </tr>
          </thead>
          <tbody>
            {dernieresInscriptions.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600 }}>{b.nom}</td>
                <td className="mono">/{b.slug}</td>
                <td>
                  <span className={`dash-badge ${b.plan === "active" ? "dash-badge-confirme" : "dash-badge-termine"}`}>
                    {b.plan}
                  </span>
                </td>
                <td>{new Date(b.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}