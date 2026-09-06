import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { mettreAJourBusiness, mettreAJourHoraires, mettreAJourImageBusiness } from "./actions";
import { ParametresTabs } from "./parametres-tabs";
import { JOURS } from "./jours";

export default async function ParametresPage() {
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

  const { data: horaires } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", business.id)
    .order("jour_semaine", { ascending: true });

  const horaireDuJour = (jour: number) =>
    horaires?.find((h) => h.jour_semaine === jour) ?? { ferme: false, heure_ouverture: "09:00", heure_fermeture: "18:00" };
  const horairesParJour = JOURS.map((_, jour) => horaireDuJour(jour));

  return (
    <div>
      <h1>Mon espace</h1>

      <ParametresTabs
        business={business}
        jours={JOURS}
        horaires={horairesParJour}
        mettreAJourBusiness={mettreAJourBusiness}
        mettreAJourHoraires={mettreAJourHoraires}
        mettreAJourImageBusiness={mettreAJourImageBusiness}
      />
    </div>
  );
}
