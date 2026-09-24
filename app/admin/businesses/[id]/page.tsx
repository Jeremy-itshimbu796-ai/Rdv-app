import { createAdminClient } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "./delete-button";

export default async function DetailBusinessPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !business) {
    notFound();
  }

  const [{ data: services }, { data: appointments }, { data: payments }] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, nom, prix, duree")
        .eq("business_id", params.id)
        .order("nom"),
      supabase
        .from("appointments")
        .select("id, client_nom, client_telephone, date, heure, statut")
        .eq("business_id", params.id)
        .order("date", { ascending: false })
        .limit(20),
      supabase
        .from("subscription_payments")
        .select("id, plan_id, montant, devise, statut, methode_paiement, periode_fin, created_at")
        .eq("business_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const planLabel: Record<string, string> = {
    basique: "Essentiel ($10)",
    pro: "Pro ($20)",
    active: "Actif",
    essai: "Essai",
  };

  return (
    <div className="admin-detail">
      <div className="admin-detail-header">
        <div>
          <Link href="/admin/businesses" className="admin-back-link">
            ← Retour aux commerces
          </Link>
          <h1>{business.nom}</h1>
          <p className="admin-detail-slug">
            <a href={`/${business.slug}`} target="_blank" rel="noreferrer">
              tonapp-rdv.vercel.app/{business.slug}
            </a>
          </p>
        </div>
        <div className="admin-detail-actions">
          <span className={`admin-badge admin-badge-${business.plan}`}>
            {planLabel[business.plan] ?? business.plan}
          </span>
          <DeleteButton businessId={business.id} businessNom={business.nom} />
        </div>
      </div>

      <div className="admin-detail-grid">
        <section className="admin-card">
          <h2>Informations</h2>
          <dl className="admin-dl">
            <dt>Téléphone</dt>
            <dd>{business.telephone ?? "—"}</dd>
            <dt>Email</dt>
            <dd>{business.email ?? "—"}</dd>
            <dt>Créé le</dt>
            <dd>{new Date(business.created_at).toLocaleDateString("fr-FR")}</dd>
            <dt>Fin d'essai</dt>
            <dd>
              {business.trial_ends_at
                ? new Date(business.trial_ends_at).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
            <dt>Rappels auto WhatsApp</dt>
            <dd>{business.rappel_auto_actif ? "Activés" : "Désactivés"}</dd>
          </dl>
        </section>

        <section className="admin-card">
          <h2>Services ({services?.length ?? 0})</h2>
          {services && services.length > 0 ? (
            <ul className="admin-list">
              {services.map((s) => (
                <li key={s.id}>
                  <span>{s.nom}</span>
                  <span className="admin-list-meta">
                    {s.prix}$ · {s.duree} min
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">Aucun service configuré.</p>
          )}
        </section>

        <section className="admin-card admin-card-wide">
          <h2>Derniers rendez-vous ({appointments?.length ?? 0})</h2>
          {appointments && appointments.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td data-label="Client">{a.client_nom}</td>
                      <td data-label="Téléphone">{a.client_telephone}</td>
                      <td data-label="Date">
                        {new Date(a.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td data-label="Heure">{a.heure}</td>
                      <td data-label="Statut">
                        <span className={`admin-status admin-status-${a.statut}`}>
                          {a.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">Aucun rendez-vous.</p>
          )}
        </section>

        <section className="admin-card admin-card-wide">
          <h2>Historique de paiement ({payments?.length ?? 0})</h2>
          {payments && payments.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Montant</th>
                    <th>Méthode</th>
                    <th>Statut</th>
                    <th>Fin de période</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Plan">{planLabel[p.plan_id] ?? p.plan_id}</td>
                      <td data-label="Montant">
                        {p.montant} {p.devise}
                      </td>
                      <td data-label="Méthode">{p.methode_paiement ?? "—"}</td>
                      <td data-label="Statut">
                        <span className={`admin-status admin-status-${p.statut}`}>
                          {p.statut}
                        </span>
                      </td>
                      <td data-label="Fin de période">
                        {p.periode_fin
                          ? new Date(p.periode_fin).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td data-label="Date">
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">Aucun paiement enregistré.</p>
          )}
        </section>
      </div>
    </div>
  );
}