"use client";

import { useState } from "react";
import { BusinessForm } from "./business-form";
import { ScheduleForm } from "./schedule-form";
import { ImageUploadField } from "./image-upload";
import { ShareLink } from "@/components/ShareLink";
import type { ActionResult } from "@/lib/action-result";

const ONGLETS = [
  { id: "identite", label: "Identité" },
  { id: "visuel", label: "Identité visuelle" },
  { id: "horaires", label: "Horaires" },
  { id: "lien", label: "Lien public" },
] as const;

type OngletId = (typeof ONGLETS)[number]["id"];

export function ParametresTabs({
  business,
  jours,
  horaires,
  mettreAJourBusiness,
  mettreAJourHoraires,
  mettreAJourImageBusiness,
}: {
  business: {
    id: string;
    slug: string;
    nom: string;
    telephone: string;
    adresse: string | null;
    description: string | null;
    logo_url: string | null;
    banniere_url: string | null;
  };
  jours: readonly string[];
  horaires: { ferme: boolean; heure_ouverture: string; heure_fermeture: string }[];
  mettreAJourBusiness: (formData: FormData) => Promise<ActionResult>;
  mettreAJourHoraires: (formData: FormData) => Promise<ActionResult>;
  mettreAJourImageBusiness: (kind: "logo" | "banniere", url: string) => Promise<ActionResult>;
}) {
  const [onglet, setOnglet] = useState<OngletId>("identite");

  return (
    <div>
      <div className="dash-tabs" role="tablist">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={onglet === o.id}
            className={`dash-tab ${onglet === o.id ? "dash-tab-active" : ""}`}
            onClick={() => setOnglet(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "identite" && (
        <div className="dash-card">
          <h2 className="dash-card-title">Informations générales</h2>
          <BusinessForm business={business} action={mettreAJourBusiness} />
        </div>
      )}

      {onglet === "visuel" && (
        <div className="dash-card">
          <h2 className="dash-card-title">Identité visuelle</h2>
          <p className="dash-card-subtitle">Ces images apparaissent sur votre page de réservation publique.</p>
          <ImageUploadField
            businessId={business.id}
            kind="logo"
            label="Logo"
            hint="Format carré recommandé."
            currentUrl={business.logo_url}
            aspect="rond"
            updateAction={mettreAJourImageBusiness}
          />
          <ImageUploadField
            businessId={business.id}
            kind="banniere"
            label="Bannière"
            hint="Format recommandé : 1200x400px."
            currentUrl={business.banniere_url}
            aspect="large"
            updateAction={mettreAJourImageBusiness}
          />
        </div>
      )}

      {onglet === "horaires" && (
        <div className="dash-card">
          <h2 className="dash-card-title dash-card-title-spaced">Horaires d'ouverture</h2>
          <ScheduleForm jours={jours} horaires={horaires} action={mettreAJourHoraires} />
        </div>
      )}

      {onglet === "lien" && (
        <div className="dash-card">
          <h2 className="dash-card-title">Votre page de réservation</h2>
          <p className="dash-card-subtitle">Partagez ce lien avec vos clients pour qu'ils puissent réserver en ligne.</p>
          <ShareLink slug={business.slug} />
        </div>
      )}
    </div>
  );
}
