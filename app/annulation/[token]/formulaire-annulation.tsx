"use client";

import { useState } from "react";
import { annulerReservation } from "./actions";

export default function FormulaireAnnulation({ token }: { token: string }) {
  const [etat, setEtat] = useState<"pret" | "chargement" | "annule">("pret");
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmerAnnulation() {
    setEtat("chargement");
    setErreur(null);

    const resultat = await annulerReservation(token);
    if (!resultat.success) {
      setEtat("pret");
      setErreur(resultat.error ?? "L'annulation n'a pas pu etre effectuee.");
      return;
    }

    setEtat("annule");
  }

  if (etat === "annule") {
    return <p className="annulation-succes">Votre rendez-vous est annule. Le commerce a ete informe.</p>;
  }

  return (
    <>
      {erreur && <p className="erreur-msg">{erreur}</p>}
      <button
        type="button"
        className="btn-confirmer annulation-btn"
        onClick={confirmerAnnulation}
        disabled={etat === "chargement"}
      >
        {etat === "chargement" ? "Annulation en cours..." : "Annuler ce rendez-vous"}
      </button>
    </>
  );
}
