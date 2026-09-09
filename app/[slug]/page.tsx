import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Image from "next/image";
import FormulaireReservation from "./formulaire-reservation";
import { MapPinIcon } from "@/components/Icons";
import FadeContent from "@/components/FadeContent";
import "./booking.css";

// URL publique : tonapp.com/nom-du-commerce
// C'est ICI que le client final choisit un service, un créneau,
// et confirme son rendez-vous (pas besoin de compte).

export default async function BookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: businesses, error: businessError } = await supabase.rpc("obtenir_business_public", {
    p_slug: params.slug,
  });
  const business = businesses?.[0];

  if (businessError || !business) notFound();

  const { data: services, error: servicesError } = await supabase.rpc("lister_services_publics", {
    p_slug: params.slug,
  });

  if (servicesError) notFound();

  return (
    <main>
      {business.banniere_url && (
        <div className="booking-banniere">
          <Image
            src={business.banniere_url}
            alt={`Bannière de ${business.nom}`}
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover" }}
          />
          <div className="booking-banniere-overlay" aria-hidden="true" />
        </div>
      )}

      <div className="booking-header-shell">
        <FadeContent duration={600}>
          <div className={`booking-header ${business.banniere_url ? "booking-header-with-banniere" : ""}`}>
            <div className="booking-identity">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={`Logo de ${business.nom}`}
                  width={72}
                  height={72}
                  className="booking-logo"
                />
              ) : (
                <div className="booking-logo-fallback" aria-hidden="true">
                  {business.nom.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="eyebrow">Réservation en ligne</span>
            <h1>{business.nom}</h1>
            {business.adresse && (
              <p className="booking-adresse">
                <MapPinIcon size={14} />
                {business.adresse}
              </p>
            )}
            {business.description && <p>{business.description}</p>}
          </div>
        </FadeContent>
      </div>

      <FormulaireReservation slug={params.slug} services={services ?? []} />
    </main>
  );
}