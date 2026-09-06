import "./landing.css";
import { CalendarIcon, CheckIcon, LinkIcon } from "@/components/Icons";
import Aurora from "@/components/Aurora";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";

export default function HomePage() {
  return (
    <main>
      <header className="lp-header">
        <div className="lp-logo">
          <span className="badge lp-logo-badge">
            <CalendarIcon size={20} style={{ color: "var(--teal)" }} />
          </span>
          TonApp
        </div>
        <div className="lp-header-actions">
          <a className="lp-link" href="/auth/connexion">
            Se connecter
          </a>
          <a className="btn-pill btn-primary" href="/auth/inscription">
            Essai gratuit
          </a>
        </div>
      </header>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, height: 500, zIndex: 0, opacity: 0.5 }}>
          <Aurora colorStops={["#4fa89b", "#f0a93a", "#4fa89b"]} amplitude={0.8} speed={0.4} />
        </div>
        <section className="lp-hero" style={{ position: "relative", zIndex: 1 }}>
          <span className="eyebrow">La réception qui ne décroche jamais</span>
          <h1>
            Les rendez-vous bien <span className="accent">accueillis.</span>
          </h1>
          <p>
            TonApp donne à votre activité une adresse simple pour réserver, et à
            chaque client la certitude d'être attendu.
          </p>
          <div className="lp-hero-actions">
            <a className="btn-pill btn-primary" href="/auth/inscription">
              Démarrer mon essai de 14 jours →
            </a>
            <a className="btn-pill btn-secondary" href="#fonctionnement">
              Découvrir TonApp
            </a>
          </div>
        </section>
      </div>

      <div className="lp-mockup-wrap">
        <div className="lp-mockup">
          <div className="lp-mockup-inner">
            <div className="lp-mockup-date">Mardi 18 juin</div>
            <h3>Bonjour, Awa</h3>

            <div className="lp-visit-card">
              <div className="left">
                <span className="icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                  </svg>
                </span>
                <div>
                  <div className="service">Coupe &amp; soin</div>
                  <div className="meta">Aujourd'hui · 15:30 · 45 min</div>
                </div>
              </div>
              <span className="lp-badge-confirme">Confirmé</span>
            </div>

            <div className="lp-stats-row">
              <div className="lp-stat-box">
                <div className="label">Ce mois-ci</div>
                <div className="value">
                  84 <span className="up">+12%</span>
                </div>
              </div>
              <div className="lp-stat-box">
                <div className="label">Sans réponse</div>
                <div className="value">0 message</div>
              </div>
            </div>

            <div className="lp-reminder-row">
              <span className="check" style={{ display: "inline-block", width: 20, height: 20, backgroundColor: "#10b981", borderRadius: "50%", color: "white", fontSize: 14, textAlign: "center", lineHeight: "20px", marginRight: 12 }}>✓</span>
              <div>
                <div className="title">Rappel WhatsApp envoyé</div>
                <div className="sub">Awa sait déjà où elle va.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FadeContent blur={true} duration={800} delay={100}>
        <section className="lp-section" id="fonctionnement">
          <span className="eyebrow">Simple côté client. Solide côté pro.</span>
          <h2 style={{ fontSize: 34, maxWidth: 520 }}>
            Votre journée, enfin à sa place.
          </h2>

          <div className="lp-steps">
            <SpotlightCard className="lp-step-card" spotlightColor="rgba(240, 169, 58, 0.25)">
              <span className="lp-step-corner">01</span>
              <div className="lp-step-icon">
                <LinkIcon size={20} style={{ color: "var(--teal-dark)" }} />
              </div>
              <h3>Un lien à partager</h3>
              <p>
                Votre page de réservation tient dans un lien. Bio Instagram,
                statut WhatsApp, carte de visite : elle vous suit partout.
              </p>
            </SpotlightCard>
            <SpotlightCard className="lp-step-card" spotlightColor="rgba(240, 169, 58, 0.25)">
              <span className="lp-step-corner">02</span>
              <div className="lp-step-icon">
                <CalendarIcon size={20} style={{ color: "var(--teal-dark)" }} />
              </div>
              <h3>Une réservation claire</h3>
              <p>
                Le client choisit sa prestation, son créneau et laisse son
                numéro. Pas de compte à créer, pas d'aller-retour.
              </p>
            </SpotlightCard>
            <SpotlightCard className="lp-step-card" spotlightColor="rgba(240, 169, 58, 0.25)">
              <span className="lp-step-corner">03</span>
              <div className="lp-step-icon">
                <CheckIcon size={20} style={{ color: "var(--teal-dark)" }} />
              </div>
              <h3>Un rappel qui compte</h3>
              <p>
                TonApp transforme chaque rendez-vous en confirmation concrète,
                avec le rappel WhatsApp que vos clients lisent vraiment.
              </p>
            </SpotlightCard>
          </div>
        </section>
      </FadeContent>

      <section className="lp-section">
        <div className="lp-touch-section">
          <div>
            <span className="eyebrow">Ce qui fait la différence</span>
            <h2 style={{ fontSize: 30, maxWidth: 460 }}>La touche TonApp</h2>
            <p style={{ color: "var(--ink-muted)", maxWidth: 440, lineHeight: 1.6 }}>
              Derrière la simplicité, un souci du détail : chaque rendez-vous
              est confirmé, rappelé et suivi automatiquement, pour que vos
              clients se sentent attendus du premier message jusqu'au jour J.
            </p>
          </div>
          <div className="lp-touch-dark">
            <span className="eyebrow">Sans effort, promis</span>
            <h2>
              Le rappel WhatsApp,
              <span className="accent-orange">envoyé tout seul.</span>
            </h2>
            <p>
              Dès qu'un client réserve, TonApp prépare et envoie le rappel au
              bon moment. Vous n'avez rien à faire, votre client n'oublie
              rien.
            </p>
            <div className="lp-touch-footer">
              <span className="dot">
                <CheckIcon size={11} />
              </span>
              Rappel automatique inclus dans chaque abonnement
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <span className="eyebrow">Pensé pour les indépendants</span>
        <h2 style={{ fontSize: 34, maxWidth: 560 }}>
          Une petite équipe. Une grande impression.
        </h2>
        <p style={{ color: "var(--ink-muted)", maxWidth: 560, lineHeight: 1.6 }}>
          Coiffeur, esthéticienne, photographe, réparateur ou coach : TonApp
          vous aide à montrer le sérieux de votre savoir-faire, sans vous
          demander de devenir gestionnaire.
        </p>

        <div className="lp-stats-band">
          <div className="box">
            <div className="big">14 jours</div>
            <div className="small">pour tout essayer</div>
          </div>
          <div className="box">
            <div className="big">0 compte</div>
            <div className="small">à créer pour réserver</div>
          </div>
        </div>

        <div className="lp-cta-band">
          <span className="eyebrow" style={{ color: "var(--ink)" }}>
            Votre porte est ouverte
          </span>
          <h2>Prêt à mieux recevoir ?</h2>
          <a className="btn-pill btn-primary" href="/auth/inscription">
            Créer mon espace →
          </a>
        </div>
      </section>

      <footer className="lp-footer">TonApp — la réception de proximité, en mieux.</footer>
    </main>
  );
}
