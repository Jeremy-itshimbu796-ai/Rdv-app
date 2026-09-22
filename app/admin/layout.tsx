import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import "../dashboard/dashboard.css";
import "./admin.css";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/connexion");

  const emailUtilisateur = user.email?.toLowerCase() ?? "";
  if (!ADMIN_EMAILS.includes(emailUtilisateur)) {
    redirect("/dashboard");
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <a href="/admin" className="dash-logo">
          <span className="badge">⚙️</span>
          Admin TonApp
        </a>

        <nav className="dash-nav">
          <a href="/admin">Vue d'ensemble</a>
          <a href="/admin/businesses">Commerces</a>
          <a href="/admin/paiements">Paiements</a>
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-business-name">{user.email}</div>
          <div className="dash-link-public">
            <a href="/dashboard">← Retour au dashboard</a>
          </div>
        </div>
      </aside>

      <main className="dash-main">{children}</main>
    </div>
  );
}