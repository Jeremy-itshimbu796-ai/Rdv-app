export interface Business {
  id: string;
  owner_id: string;
  nom: string;
  slug: string;
  telephone: string;
  adresse: string | null;
  description: string | null;
  logo_url: string | null;
  plan: "trial" | "active" | "suspended";
  trial_ends_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  nom: string;
  description: string | null;
  prix: number;
  duree_minutes: number;
  date_fin: string | null;
  actif: boolean;
}

export interface BusinessHour {
  id: string;
  business_id: string;
  jour_semaine: number; // 0 = dimanche ... 6 = samedi
  heure_ouverture: string;
  heure_fermeture: string;
  ferme: boolean;
}

export interface Appointment {
  id: string;
  business_id: string;
  service_id: string | null;
  client_nom: string;
  client_telephone: string;
  date_heure: string;
  duree_minutes: number;
  statut: "confirme" | "annule" | "termine" | "no_show";
  notes: string | null;
}
