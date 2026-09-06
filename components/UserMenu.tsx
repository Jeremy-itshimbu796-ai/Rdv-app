"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { LogOutIcon } from "@/components/Icons";

export function UserMenu({ nom, slug }: { nom: string; slug: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!ouvert) return;

    function surClicExterieur(e: MouseEvent) {
      if (!conteneurRef.current?.contains(e.target as Node)) setOuvert(false);
    }
    function surEchap(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    document.addEventListener("keydown", surEchap);
    return () => {
      document.removeEventListener("mousedown", surClicExterieur);
      document.removeEventListener("keydown", surEchap);
    };
  }, [ouvert]);

  async function seDeconnecter() {
    if (deconnexionEnCours) return;
    setDeconnexionEnCours(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/connexion");
    router.refresh();
  }

  const initiale = nom.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="user-menu-wrap" ref={conteneurRef}>
      <button
        type="button"
        className="user-menu-btn"
        aria-label="Menu du compte"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
      >
        <span className="user-avatar">{initiale}</span>
      </button>

      {ouvert && (
        <div className="user-menu-dropdown" role="menu">
          <a href="/dashboard/parametres" className="user-menu-item" role="menuitem" onClick={() => setOuvert(false)}>
            Mon espace
          </a>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="user-menu-item"
            role="menuitem"
            onClick={() => setOuvert(false)}
          >
            Voir ma page publique
          </a>
          <button
            type="button"
            className="user-menu-item user-menu-item-danger"
            role="menuitem"
            disabled={deconnexionEnCours}
            aria-busy={deconnexionEnCours}
            onClick={seDeconnecter}
          >
            <LogOutIcon size={15} />
            {deconnexionEnCours ? "Deconnexion..." : "Se deconnecter"}
          </button>
        </div>
      )}
    </div>
  );
}
