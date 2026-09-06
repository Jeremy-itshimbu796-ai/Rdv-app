import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ajouterService, modifierService, toggleService, supprimerService } from "./actions";
import { ServicesManager } from "./services-manager";

export default async function ServicesPage() {
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

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  return (
    <ServicesManager
      services={services ?? []}
      ajouterService={ajouterService}
      modifierService={modifierService}
      toggleService={toggleService}
      supprimerService={supprimerService}
    />
  );
}