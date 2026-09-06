"use client";

import { useEffect } from "react";
import { XIcon } from "@/components/Icons";

export function Modal({
  titre,
  onFermer,
  children,
}: {
  titre: string;
  onFermer: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function surEchap(e: KeyboardEvent) {
      if (e.key === "Escape") onFermer();
    }
    document.addEventListener("keydown", surEchap);
    return () => document.removeEventListener("keydown", surEchap);
  }, [onFermer]);

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={titre} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titre}</h2>
          <button type="button" className="modal-close" aria-label="Fermer" onClick={onFermer}>
            <XIcon size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
