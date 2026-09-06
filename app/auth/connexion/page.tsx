"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { CalendarIcon } from "@/components/Icons";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";
// @ts-ignore
import "../auth.css";

export default function ConnexionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    setEnCours(false);

    if (error) {
      setErreur(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-shell">
      <a href="/" className="auth-logo">
        <span className="badge auth-logo-badge">
          <CalendarIcon size={20} style={{ color: "var(--ink)" }} />
        </span>
        TonApp
      </a>

      <FadeContent duration={400}>
        <SpotlightCard className="auth-card" spotlightColor="rgba(79, 168, 155, 0.2)">
          <h1>Content de vous revoir</h1>
          <p className="sub">Connectez-vous pour retrouver votre espace.</p>

          <form onSubmit={handleSubmit}>
            {erreur && <p className="auth-erreur">{erreur}</p>}

            <div className="auth-champ">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-champ">
              <label>Mot de passe</label>
              <input
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={enCours}>
              {enCours ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="auth-switch">
            Pas encore de compte ? <a href="/auth/inscription">Créer mon espace</a>
          </p>
        </SpotlightCard>
      </FadeContent>
    </div>
  );
}