import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { NavLinks } from "@/components/NavLinks";
import { NotificationsButton } from "@/components/NotificationsButton";
import { UserMenu } from "@/components/UserMenu";
import { CalendarIcon } from "@/components/Icons";
import "./dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const { data: dernierPaiement } = await supabase
    .from("subscription_payments")
    .select("periode_fin")
    .eq("business_id", business.id)
    .eq("statut", "successful")
    .order("periode_fin", { ascending: false })
    .limit(1)
    .maybeSingle();

  const finEssai = new Date(business.trial_ends_at);
  const joursRestants = Math.ceil((finEssai.getTime() - Date.now()) / 86_400_000);
  const essaiExpire = business.plan === "trial" && joursRestants < 0;
  const essaiBientotExpire = business.plan === "trial" && joursRestants >= 0 && joursRestants <= 3;
  const finAbonnement = dernierPaiement?.periode_fin ? new Date(dernierPaiement.periode_fin) : null;
  const joursAbonnementRestants = finAbonnement ? Math.ceil((finAbonnement.getTime() - Date.now()) / 86_400_000) : null;
  const abonnementBientotExpire = business.plan === "active" && joursAbonnementRestants !== null && joursAbonnementRestants >= 0 && joursAbonnementRestants <= 3;

  const logo = (
    <a href="/" className="dash-logo">
      <span className="badge dash-logo-badge">
        <CalendarIcon size={20} style={{ color: "var(--teal)" }} />
      </span>
      TonApp
    </a>
  );

  const nav = (
    <NavLinks
      liens={[
        { href: "/dashboard", label: "Vue d'ensemble" },
        { href: "/dashboard/rendez-vous", label: "Rendez-vous" },
        { href: "/dashboard/services", label: "Services" },
        { href: "/dashboard/parametres", label: "Paramètres" },
        { href: "/dashboard/abonnement", label: "Abonnement" },
      ]}
    />
  );

  const headerActions = (
    <>
      <NotificationsButton />
      <UserMenu nom={business.nom} slug={business.slug} />
    </>
  );

  const footer = (
    <div className="dash-sidebar-footer">
      <div className="dash-business-name">{business.nom}</div>
      <div className="dash-link-public">
        <a href={`/${business.slug}`} target="_blank">
          Voir ma page publique ↗
        </a>
      </div>
    </div>
  );

  return (
    <DashboardShell logo={logo} nav={nav} footer={footer} headerActions={headerActions}>
      {essaiExpire && (
        <div className="dash-trial-alert dash-trial-expired" role="alert">
          <div>
            <strong>Votre essai gratuit est termine.</strong>
            <span> Votre page de reservation est actuellement indisponible.</span>
          </div>
          <a href="/dashboard/abonnement">Voir l'abonnement</a>
        </div>
      )}
      {essaiBientotExpire && (
        <div className="dash-trial-alert" role="status">
          <div>
            <strong>{joursRestants === 0 ? "Votre essai se termine aujourd'hui." : `Votre essai se termine dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}.`}</strong>
            <span> Activez votre abonnement pour garder votre page de reservation ouverte.</span>
          </div>
          <a href="/dashboard/abonnement">Choisir un abonnement</a>
        </div>
      )}
      {abonnementBientotExpire && (
        <div className="dash-trial-alert" role="status">
          <div>
            <strong>{joursAbonnementRestants === 0 ? "Votre abonnement se termine aujourd'hui." : `Votre abonnement se termine dans ${joursAbonnementRestants} jour${joursAbonnementRestants > 1 ? "s" : ""}.`}</strong>
            <span> Renouvelez-le pour garder votre page de reservation ouverte.</span>
          </div>
          <a href="/dashboard/abonnement">Renouveler</a>
        </div>
      )}
      {children}
    </DashboardShell>
  );
}