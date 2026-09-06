"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";
import { useToast } from "@/components/Toast";
import { ImagePlusIcon } from "@/components/Icons";
import type { ActionResult } from "@/lib/action-result";

const TAILLE_MAX = 2 * 1024 * 1024;
const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function ImageUploadField({
  businessId,
  kind,
  label,
  hint,
  currentUrl,
  aspect,
  updateAction,
}: {
  businessId: string;
  kind: "logo" | "banniere";
  label: string;
  hint?: string;
  currentUrl: string | null;
  aspect: "rond" | "large";
  updateAction: (kind: "logo" | "banniere", url: string) => Promise<ActionResult>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const showToast = useToast();

  function ouvrirSelecteur() {
    inputRef.current?.click();
  }

  async function surChangement(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;

    setErreur(null);

    if (!TYPES_ACCEPTES.includes(fichier.type)) {
      setErreur("Format non supporte. Utilisez une image JPG, PNG ou WEBP.");
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      setErreur("L'image depasse la taille maximale de 2 Mo.");
      return;
    }

    setEnCours(true);
    try {
      const supabase = createClient();
      const chemin = `${businessId}/${kind}.${EXTENSIONS[fichier.type]}`;

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(chemin, fichier, { upsert: true, contentType: fichier.type });
      if (uploadError) {
        setErreur("Le televersement a echoue. Verifiez votre connexion et reessayez.");
        return;
      }

      const { data } = supabase.storage.from("business-assets").getPublicUrl(chemin);
      const urlAvecVersion = `${data.publicUrl}?v=${Date.now()}`;

      const result = await updateAction(kind, urlAvecVersion);
      if (!result.success) {
        setErreur(result.error);
        return;
      }

      setPreview(urlAvecVersion);
      showToast("success", "Image mise a jour.");
    } catch {
      setErreur("Une erreur reseau est survenue. Veuillez reessayer.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {hint && <p className="image-upload-hint">{hint}</p>}

      <button
        type="button"
        onClick={ouvrirSelecteur}
        disabled={enCours}
        className={`image-upload-zone image-upload-${aspect} ${preview ? "image-upload-zone-filled" : ""}`}
        aria-label={preview ? `Remplacer ${label.toLowerCase()}` : `Ajouter ${label.toLowerCase()}`}
      >
        {preview ? (
          <Image
            src={preview}
            alt={label}
            fill
            sizes={aspect === "rond" ? "96px" : "320px"}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span className="image-upload-empty">
            <ImagePlusIcon size={22} />
            <span>Ajouter une image</span>
          </span>
        )}
        {enCours && (
          <span className="image-upload-overlay" aria-live="polite">
            <span className="btn-spinner" aria-hidden="true" />
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={surChangement}
        className="image-upload-input"
      />

      {erreur && <p className="form-error" role="alert">{erreur}</p>}
    </div>
  );
}
