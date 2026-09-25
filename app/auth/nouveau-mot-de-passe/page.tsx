"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { CalendarIcon } from "@/components/Icons";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";
// @ts-ignore
import "../auth.css";

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    // Le lien de reset ouvre une session temporaire cote client (event PASSWORD_RECOVERY)
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPret(true);
      }
    });

    // Si la session existe deja au chargement (cas frequent), on autorise directement
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPret(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (motDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnCours(false);

    if (error) {
      setErreur("Une erreur est survenue. Le lien a peut-etre expire.");
      return;
    }

    setSucces(true);
    setTimeout(() => {
      router.push("/auth/connexion");
    }, 2000);
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
          {succes ? (
            <>
              <h1>Mot de passe mis a jour</h1>
              <p className="sub">Redirection vers la connexion...</p>
            </>
          ) : !pret ? (
            <>
              <h1>Verification du lien...</h1>
              <p className="sub">
                Si rien ne se passe, le lien a peut-etre expire.{" "}
                <a href="/auth/mot-de-passe-oublie">Redemander un lien</a>.
              </p>
            </>
          ) : (
            <>
              <h1>Nouveau mot de passe</h1>
              <p className="sub">Choisis un nouveau mot de passe pour ton compte.</p>

              <form onSubmit={handleSubmit}>
                {erreur && <p className="auth-erreur">{erreur}</p>}

                <div className="auth-champ">
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <div className="auth-champ">
                  <label>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className="auth-submit" disabled={enCours}>
                  {enCours ? "Mise a jour..." : "Changer le mot de passe"}
                </button>
              </form>
            </>
          )}
        </SpotlightCard>
      </FadeContent>
    </div>
  );
}