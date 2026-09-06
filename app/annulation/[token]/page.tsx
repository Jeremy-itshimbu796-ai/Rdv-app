import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { cancellationTokenSchema } from "@/lib/validation";
import FormulaireAnnulation from "./formulaire-annulation";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";
import "../../[slug]/booking.css";

export default async function AnnulationPage({ params }: { params: { token: string } }) {
  const validation = cancellationTokenSchema.safeParse(params.token);
  if (!validation.success) notFound();

  const supabase = createClient();
  const { data, error } = await supabase.rpc("obtenir_annulation_publique", {
    p_token: validation.data,
  });
  const rendezVous = data?.[0];

  if (error || !rendezVous) notFound();

  const estAnnule = rendezVous.statut === "annule";
  const estPasse = new Date(rendezVous.date_heure) <= new Date();
  const dateFormatee = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(new Date(rendezVous.date_heure));

  return (
    <main className="booking-shell annulation-shell">
      <FadeContent duration={600}>
        <header className="booking-header">
          <span className="eyebrow">Gestion du rendez-vous</span>
          <h1>{rendezVous.business_nom}</h1>
        </header>

        <SpotlightCard className="recap-rdv" spotlightColor="rgba(240, 169, 58, 0.2)">
          <div className="service-nom">{rendezVous.service_nom ?? "Rendez-vous"}</div>
          <div className="datetime">{dateFormatee}</div>
        </SpotlightCard>

        {estAnnule ? (
          <p className="annulation-succes">Ce rendez-vous est deja annule.</p>
        ) : estPasse ? (
          <p className="no-creneaux">Ce rendez-vous est deja passe et ne peut plus etre annule.</p>
        ) : (
          <FormulaireAnnulation token={validation.data} />
        )}
      </FadeContent>
    </main>
  );
}
