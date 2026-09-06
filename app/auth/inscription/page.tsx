"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { CalendarIcon } from "@/components/Icons";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";
// @ts-ignore
import "../auth.css";

function genererSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function InscriptionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [etape, setEtape] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nomBusiness, setNomBusiness] = useState("");
  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const slug = useMemo(() => genererSlug(nomBusiness), [nomBusiness]);

  const forcePassword = useMemo(() => {
    let score = 0;
    if (motDePasse.length >= 6) score++;
    if (motDePasse.length >= 10) score++;
    if (/[A-Z]/.test(motDePasse) && /[a-z]/.test(motDePasse)) score++;
    if (/\d/.test(motDePasse) || /[^A-Za-z0-9]/.test(motDePasse)) score++;
    return score;
  }, [motDePasse]);

  const labelForce = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"][forcePassword];

  async function handleCompteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (motDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setErreur(null);
    setEtape(2);
  }

  async function handleBusinessSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: motDePasse,
    });

    if (authError) {
      setEnCours(false);
      setErreur(authError.message);
      return;
    }

    if (!authData.user) {
      setEnCours(false);
      setErreur("Erreur inattendue. Réessaie.");
      return;
    }

    const { error: businessError } = await supabase.from("businesses").insert({
      owner_id: authData.user.id,
      nom: nomBusiness.trim(),
      slug,
      telephone: telephone.trim(),
    });

    setEnCours(false);

    if (businessError) {
      setErreur(
        businessError.message.includes("duplicate")
          ? "Ce nom d'espace est déjà pris, essaie une variante."
          : "Erreur lors de la création de votre espace."
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
          {etape === 1 ? (
            <>
              <span className="auth-step-label">Étape 1/2</span>
            <h1>Créer votre compte</h1>
            <p className="sub">14 jours d'essai gratuit, sans carte bancaire.</p>

            <form onSubmit={handleCompteSubmit}>
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
                  autoComplete="new-password"
                  minLength={6}
                />
                {motDePasse.length > 0 && (
                  <div className="password-strength" aria-live="polite">
                    <div className="password-strength-bar">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`password-strength-segment ${i < forcePassword ? `password-strength-${forcePassword}` : ""}`} />
                      ))}
                    </div>
                    <span className="password-strength-label">{labelForce}</span>
                  </div>
                )}
                <p className="hint">Minimum 6 caractères.</p>
              </div>

              <button type="submit" className="auth-submit">
                Continuer →
              </button>
            </form>
          </>
        ) : (
          <>
            <span className="auth-step-label">Étape 2/2</span>
            <h1>Votre espace</h1>
            <p className="sub">Ces infos apparaîtront sur votre page de réservation.</p>

            <form onSubmit={handleBusinessSubmit}>
              {erreur && <p className="auth-erreur">{erreur}</p>}

              <div className="auth-champ">
                <label>Nom de votre activité</label>
                <input
                  type="text"
                  placeholder="Salon Awa Coiffure"
                  value={nomBusiness}
                  onChange={(e) => setNomBusiness(e.target.value)}
                  required
                />
                {slug && <p className="auth-slug-preview">tonapp.com/{slug}</p>}
              </div>

              <div className="auth-champ">
                <label>Numéro WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+243 ..."
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={enCours}>
                {enCours ? "Création en cours..." : "Créer mon espace →"}
              </button>
            </form>
          </>
        )}

          <p className="auth-switch">
            Déjà un compte ? <a href="/auth/connexion">Se connecter</a>
          </p>
        </SpotlightCard>
      </FadeContent>
    </div>
  );
}