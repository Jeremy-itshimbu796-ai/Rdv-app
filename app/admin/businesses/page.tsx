import { createAdminClient } from "@/lib/supabase-admin";

export default async function AdminBusinessesPage() {
  const supabase = createAdminClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, nom, slug, telephone, plan, trial_ends_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1>Tous les commerces</h1>

      {!businesses?.length ? (
        <div className="dash-empty">Aucun commerce inscrit.</div>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Lien public</th>
              <th>Téléphone</th>
              <th>Plan</th>
              <th>Fin d'essai</th>
              <th>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600 }}>{b.nom}</td>
                <td className="mono">
                  <a href={`/${b.slug}`} target="_blank">/{b.slug}</a>
                </td>
                <td className="mono">{b.telephone}</td>
                <td>
                  <span className={`dash-badge ${b.plan === "active" ? "dash-badge-confirme" : b.plan === "suspended" ? "dash-badge-annule" : "dash-badge-termine"}`}>
                    {b.plan}
                  </span>
                </td>
                <td>{b.trial_ends_at ? new Date(b.trial_ends_at).toLocaleDateString("fr-FR") : "—"}</td>
                <td>{new Date(b.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}