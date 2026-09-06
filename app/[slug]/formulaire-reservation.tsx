"use client";

import { useState, useEffect } from "react";
import { reservationSchema } from "@/lib/validation";
import { chargerCreneauxPublics, creerReservation, type CreneauPublic } from "./actions";
import type { Service } from "@/lib/types";
import { CheckIcon, ArrowLeftIcon } from "@/components/Icons";
import SpotlightCard from "@/components/SpotlightCard";
import "./booking.css";

type Etape = "service" | "creneau" | "coordonnees" | "confirme";

const ETAPES: Etape[] = ["service", "creneau", "coordonnees", "confirme"];

export default function FormulaireReservation({
  slug,
  services,
}: {
  slug: string;
  services: Service[];
}) {
  const [etape, setEtape] = useState<Etape>("service");
  const [serviceChoisi, setServiceChoisi] = useState<Service | null>(null);
  const [dateChoisie, setDateChoisie] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [creneauChoisi, setCreneauChoisi] = useState<string | null>(null);
  const [creneaux, setCreneaux] = useState<CreneauPublic[]>([]);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [creneauxEnChargement, setCreneauxEnChargement] = useState(false);

  useEffect(() => {
    if (!serviceChoisi) return;
    const serviceId = serviceChoisi.id;

    async function chargerDisponibilites() {
      setErreur(null);
      setCreneauxEnChargement(true);
      const resultat = await chargerCreneauxPublics({
        slug,
        serviceId,
        date: dateChoisie,
      });
      setCreneauxEnChargement(false);
      if (!resultat.success) {
        setCreneaux([]);
        setErreur(resultat.error ?? "Les disponibilites sont indisponibles.");
        return;
      }
      setCreneaux(resultat.creneaux);
    }

    chargerDisponibilites();
  }, [serviceChoisi, slug, dateChoisie]);

  function choisirService(service: Service) {
    setServiceChoisi(service);
    setEtape("creneau");
  }

  function choisirCreneau(heure: string) {
    setCreneauChoisi(heure);
    setEtape("coordonnees");
  }

  async function confirmerReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceChoisi || !creneauChoisi) return;

    setEnvoiEnCours(true);
    setErreur(null);

    const input = {
      slug,
      serviceId: serviceChoisi.id,
      date: dateChoisie,
      heure: creneauChoisi,
      clientNom: nom,
      clientTelephone: telephone,
    };
    const validation = reservationSchema.safeParse(input);
    if (!validation.success) {
      setErreur(validation.error.issues[0]?.message ?? "Les informations sont invalides.");
      return;
    }

    const resultat = await creerReservation(input);

    setEnvoiEnCours(false);

    if (!resultat.success) {
      setErreur(resultat.error ?? "Une erreur est survenue.");
      return;
    }

    setEtape("confirme");
  }

  const indexEtape = ETAPES.indexOf(etape);

  return (
    <div className="booking-shell">
      <div className="step-dots">
        {ETAPES.map((s, i) => (
          <span key={s} className={i <= indexEtape ? "active" : ""} />
        ))}
      </div>

      {etape === "service" && (
        <div key="service" className="booking-step">
          <h2>Choisissez un service</h2>
          {services.map((service, i) => (
            <button
              key={service.id}
              className="service-card booking-stagger"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => choisirService(service)}
            >
              <span className="nom">{service.nom}</span>
              <span className="meta">
                <span className="prix">{service.prix}$</span> · {service.duree_minutes} min
              </span>
            </button>
          ))}
        </div>
      )}

      {etape === "creneau" && serviceChoisi && (
        <div key="creneau" className="booking-step">
          <button className="btn-retour" onClick={() => setEtape("service")}>
            <ArrowLeftIcon size={18} style={{ marginRight: 8 }} />
            Changer de service
          </button>
          <h2>Quand ça vous arrange ?</h2>

          <input
            type="date"
            className="date-picker"
            value={dateChoisie}
            min={new Date().toLocaleDateString("en-CA")}
            onChange={(e) => setDateChoisie(e.target.value)}
          />

          {creneauxEnChargement ? (
            <div className="creneaux-grid" aria-busy="true" aria-label="Chargement des créneaux">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="creneau-skeleton" />
              ))}
            </div>
          ) : creneaux.filter((c) => c.disponible).length === 0 ? (
            <p className="no-creneaux">Aucun créneau disponible ce jour-là.</p>
          ) : (
            <div className="creneaux-grid">
              {creneaux
                .filter((c) => c.disponible)
                .map((c, i) => (
                  <button
                    key={c.heure}
                    className="creneau-btn booking-stagger"
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => choisirCreneau(c.heure)}
                  >
                    {c.heure}
                  </button>
                ))}
            </div>
          )}
          {erreur && <p className="erreur-msg">{erreur}</p>}
        </div>
      )}

      {etape === "coordonnees" && serviceChoisi && creneauChoisi && (
        <form key="coordonnees" onSubmit={confirmerReservation} className="booking-step">
          <button type="button" className="btn-retour" onClick={() => setEtape("creneau")}>
            <ArrowLeftIcon size={18} style={{ marginRight: 8 }} />
            Changer de créneau
          </button>

          <SpotlightCard className="recap-rdv" spotlightColor="rgba(79, 168, 155, 0.2)">
            <div className="service-nom">{serviceChoisi.nom}</div>
            <div className="datetime mono">
              {new Date(`${dateChoisie}T12:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {creneauChoisi}
            </div>
          </SpotlightCard>

          <div className="champ">
            <label>Nom complet</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>

          <div className="champ">
            <label>Numéro WhatsApp</label>
            <input
              type="tel"
              placeholder="+243 ..."
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
            />
          </div>

          {erreur && <p className="erreur-msg">{erreur}</p>}

          <button type="submit" className="btn-confirmer" disabled={envoiEnCours}>
            {envoiEnCours ? "Confirmation en cours..." : "Confirmer le rendez-vous"}
          </button>
        </form>
      )}

      {etape === "confirme" && (
        <div key="confirme" className="confirmation-wrap booking-step">
          <div className="confirmation-check">
            <CheckIcon size={48} />
          </div>
          <h2>C'est noté !</h2>
          <p className="confirmation-sub">
            Vous recevrez un rappel avant votre rendez-vous.
          </p>

          <div className="whatsapp-bubble whatsapp-bubble-enter">
            <span className="tag">Aperçu du rappel WhatsApp</span>
            Bonjour {nom.split(" ")[0] || ""}, rappel de votre rendez-vous pour "
            {serviceChoisi?.nom}" demain à {creneauChoisi}. A bientôt !
          </div>
        </div>
      )}
    </div>
  );
}
