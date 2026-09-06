import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-shell">
      <span className="eyebrow">Page introuvable</span>
      <h1>Ce lien n'est plus disponible.</h1>
      <p>Verifiez l'adresse ou retournez a l'accueil.</p>
      <Link href="/" className="not-found-link">Retour a TonApp</Link>
    </main>
  );
}
