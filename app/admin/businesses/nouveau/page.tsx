import { creerBusiness } from "./actions";
import Link from "next/link";

export default function NouveauBusinessPage() {
  return (
    <div className="admin-detail">
      <Link href="/admin/businesses" className="admin-back-link">
        ← Retour aux commerces
      </Link>
      <h1>Ajouter un commerce</h1>

      <form action={creerBusiness} className="admin-card admin-form">
        <label>
          Nom du commerce
          <input type="text" name="nom" required placeholder="Ex: Salon Belle Époque" />
        </label>

        <label>
          Slug (URL publique)
          <input type="text" name="slug" required placeholder="ex: belle-epoque" pattern="[a-z0-9\-]+" />
        </label>

        <label>
          Téléphone
          <input type="tel" name="telephone" required placeholder="+243 ..." />
        </label>

        <label>
          Email (servira à se connecter)
          <input type="email" name="email" required placeholder="proprietaire@email.com" />
        </label>

        <label>
          Mot de passe temporaire
          <input type="text" name="password" required minLength={6} placeholder="À transmettre au client" />
        </label>

        <label>
          Plan
          <select name="plan" defaultValue="essai">
            <option value="essai">Essai</option>
            <option value="basique">Essentiel ($10)</option>
            <option value="pro">Pro ($20)</option>
          </select>
        </label>

        <button type="submit" className="admin-btn admin-btn-primary">
          Créer le commerce
        </button>
      </form>
    </div>
  );
}