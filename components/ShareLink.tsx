"use client";

import { useState } from "react";

export function ShareLink({ slug }: { slug: string }) {
  const [copie, setCopie] = useState(false);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://tonapp.com";
  const url = `${base}/${slug}`;

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      setCopie(false);
    }
  }

  async function partager() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Reservez en ligne", url });
      } catch {
        // partage annule par l'utilisateur, rien a faire
      }
    } else {
      copier();
    }
  }

  return (
    <div className="share-link">
      <div className="share-link-url mono">{url}</div>
      <div className="share-link-actions">
        <button type="button" className="dash-btn dash-btn-secondary" onClick={copier}>
          {copie ? "Copié !" : "Copier le lien"}
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="dash-btn dash-btn-secondary">
          Ouvrir la page
        </a>
        <button type="button" className="dash-btn" onClick={partager}>
          Partager
        </button>
      </div>
    </div>
  );
}
