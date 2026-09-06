import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { changerStatut } from "./actions";
import { AppointmentDetailButton } from "./appointment-modal";

const FILTRES = [
  { valeur: "a_venir", label: "A venir" },
  { valeur: "passes", label: "Passes" },
  { valeur: "annules", label: "Annules" },
  { valeur: "tous", label: "Tous" },
] as const;

export default async function RendezVousPage({
  searchParams,
}: {
  searchParams: { filtre?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/connexion");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/auth/inscription");

  const filtre = searchParams.filtre ?? "a_venir";
  const maintenant = new Date().toISOString();

  let query = supabase
    .from("appointments")
    .select("*, services(nom)")
    .eq("business_id", business.id);

  if (filtre === "a_venir") {
    query = query.eq("statut", "confirme").gte("date_heure", maintenant).order("date_heure", { ascending: true });
  } else if (filtre === "passes") {
    query = query.in("statut", ["confirme", "termine", "no_show"]).lt("date_heure", maintenant).order("date_heure", { ascending: false });
  } else if (filtre === "annules") {
    query = query.eq("statut", "annule").order("date_heure", { ascending: false });
  } else {
    query = query.order("date_heure", { ascending: false });
  }

  const { data: appointments } = await query;

  const heureFr = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const badgeClass = (statut: string) => {
    if (statut === "confirme") return "dash-badge-confirme";
    if (statut === "annule") return "dash-badge-annule";
    return "dash-badge-termine";
  };

  return (
    <div>
      <h1>Rendez-vous</h1>

      <div className="rdv-filters">
        {FILTRES.map((f) => (
          <a
            key={f.valeur}
            href={`/dashboard/rendez-vous?filtre=${f.valeur}`}
            className={`dash-btn-secondary dash-btn rdv-filter-link ${filtre === f.valeur ? "rdv-filter-active" : ""}`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="dash-empty">Aucun rendez-vous dans cette categorie.</div>
      ) : (
        <div className="dash-table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Telephone</th>
              <th>Service</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt: any) => (
              <tr key={appt.id}>
                <td className="mono">{heureFr(appt.date_heure)}</td>
                <td>{appt.client_nom}</td>
                <td className="mono">{appt.client_telephone}</td>
                <td>{appt.services?.nom ?? "-"}</td>
                <td>
                  <span className={`dash-badge ${badgeClass(appt.statut)}`}>{appt.statut}</span>
                </td>
                <td>
                  <AppointmentDetailButton appointment={appt} filtre={filtre} action={changerStatut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
