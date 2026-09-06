import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/connexion");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/auth/inscription");

  const today = new Date().toISOString().split("T")[0];
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, services(nom)")
    .eq("business_id", business.id)
    .gte("date_heure", `${today}T00:00:00`)
    .lte("date_heure", `${today}T23:59:59`)
    .order("date_heure", { ascending: true });

  const heureFr = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const badgeClass = (statut: string) => {
    if (statut === "confirme") return "dash-badge-confirme";
    if (statut === "annule") return "dash-badge-annule";
    return "dash-badge-termine";
  };

  return (
    <div>
      <h1>Bonjour, {business.nom}</h1>

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Rendez-vous d'aujourd'hui</h2>

      <FadeContent duration={500}>
        {!appointments || appointments.length === 0 ? (
          <div className="dash-empty">Aucun rendez-vous prévu aujourd'hui.</div>
        ) : (
          <SpotlightCard className="dash-table-card" spotlightColor="rgba(79, 168, 155, 0.15)">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt: any) => (
                  <tr key={appt.id}>
                    <td className="mono">{heureFr(appt.date_heure)}</td>
                    <td>{appt.client_nom}</td>
                    <td>{appt.services?.nom ?? "—"}</td>
                    <td>
                      <span className={`dash-badge ${badgeClass(appt.statut)}`}>
                        {appt.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SpotlightCard>
        )}
      </FadeContent>
    </div>
  );
}
