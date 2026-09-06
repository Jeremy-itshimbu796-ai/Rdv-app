import { headers } from "next/headers";

// In-memory sliding-window limiter, scoped to a single server process.
// Fine for a single-instance deployment; if TonApp ever scales to multiple
// server instances, replace this with a shared store (e.g. Upstash Redis).
const hits = new Map<string, number[]>();

const NETTOYAGE_INTERVALLE_MS = 5 * 60_000;
let dernierNettoyage = Date.now();

function nettoyer(maintenant: number) {
  if (maintenant - dernierNettoyage < NETTOYAGE_INTERVALLE_MS) return;
  dernierNettoyage = maintenant;
  for (const [cle, horodatages] of hits) {
    const restants = horodatages.filter((t) => maintenant - t < NETTOYAGE_INTERVALLE_MS);
    if (restants.length === 0) hits.delete(cle);
    else hits.set(cle, restants);
  }
}

/** Retourne true si l'appel est autorisé, false si la limite est dépassée. */
export function limiteAtteinte(cle: string, maxRequetes: number, fenetreMs: number): boolean {
  const maintenant = Date.now();
  nettoyer(maintenant);

  const horodatages = (hits.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
  if (horodatages.length >= maxRequetes) {
    hits.set(cle, horodatages);
    return true;
  }

  horodatages.push(maintenant);
  hits.set(cle, horodatages);
  return false;
}

/** Adresse IP du client, à utiliser comme clé de rate limiting dans les Server Actions. */
export function ipClient(): string {
  const liste = headers().get("x-forwarded-for");
  return liste?.split(",")[0]?.trim() || headers().get("x-real-ip") || "inconnu";
}
