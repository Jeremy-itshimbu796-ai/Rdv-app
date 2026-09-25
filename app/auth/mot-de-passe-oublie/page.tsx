"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CalendarIcon } from "@/components/Icons";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";
// @ts-ignore
import "../auth.css";

export default function MotDePasseOubliePage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/nouveau-mot-de-passe`,
    });

    setEnCours(false);
    if (error) {
        console.error("Erreur reset password:", error);
        setErreur(`Erreur: ${error.message}`);
    return;
}

    setEnvoye(true);
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
          {envoye ? (
            <>
              <h1>Email envoyé</h1>
              <p className="sub">
                Si un compte existe avec cet email, un lien de réinitialisation
                vient d'être envoyé. Vérifie ta boîte mail (et les spams).
              </p>
              <p className="auth-switch">
                <a href="/auth/connexion">Retour à la connexion</a>
              </p>
            </>
          ) : (
            <>
              <h1>Mot de passe oublié</h1>
              <p className="sub">
                Entre ton email, on t'envoie un lien pour en créer un nouveau.
              </p>

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

                <button type="submit" className="auth-submit" disabled={enCours}>
                  {enCours ? "Envoi..." : "Envoyer le lien"}
                </button>
              </form>

              <p className="auth-switch">
                <a href="/auth/connexion">Retour à la connexion</a>
              </p>
            </>
          )}
        </SpotlightCard>
      </FadeContent>
    </div>
  );
}