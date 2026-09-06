# TonApp

SaaS de prise de rendez-vous pour independants, avec confirmation et rappels WhatsApp.

## Demarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

La validation de l'environnement est documentee dans `.env.example`. Ne versionnez jamais `.env.local` ni les secrets Meta.

## Base Supabase

La migration [supabase/migrations/202609010001_initial_schema.sql](supabase/migrations/202609010001_initial_schema.sql) cree le schema, les indexes, les policies RLS, les RPC publiques et la contrainte anti-chevauchement.

```bash
supabase link --project-ref VOTRE_PROJECT_REF
supabase db push
supabase gen types typescript --linked --schema public > lib/database.types.ts
```

Le dernier fichier doit ensuite etre utilise pour typer les clients Supabase. La migration doit etre revue avant application sur une base existante: elle constitue le schema de reference du depot.

## WhatsApp Business Cloud

1. Creez et faites approuver dans Meta les templates francais `appointment_confirmation` et `appointment_reminder`.
2. Le template de confirmation a quatre variables body, dans cet ordre: nom client, service, date/heure, lien unique d'annulation.
3. Le template de rappel a trois variables body: nom client, service, date/heure.
4. Ajoutez les secrets uniquement dans Supabase:

```bash
supabase secrets set META_WHATSAPP_TOKEN=... META_WHATSAPP_PHONE_NUMBER_ID=... META_WHATSAPP_CONFIRMATION_TEMPLATE=appointment_confirmation META_WHATSAPP_REMINDER_TEMPLATE=appointment_reminder APP_URL=https://votre-domaine.com
supabase functions deploy send-reminders --no-verify-jwt
```

5. Planifiez l'appel toutes les 15 minutes avec `pg_cron` et `pg_net`, en conservant l'URL et les identifiants dans Supabase Vault. La fonction deduplique les logs par rendez-vous/type de rappel, puis effectue au plus trois tentatives apres 15 min, 1 h et 4 h.

## Composants et patterns UI (dashboard)

- **Server Actions** : toutes les actions du dashboard retournent un `ActionResult` typé (`lib/action-result.ts`) au lieu d'échouer silencieusement — `{ success: true }` ou `{ success: false, error: string }`. Les validations utilisent les schémas Zod de `lib/validation.ts`.
- **`components/Toast.tsx`** : `ToastProvider` (monté une fois dans `app/layout.tsx`) + `useToast()` pour afficher un toast succès/erreur avec auto-dismiss (4.5s) et fermeture manuelle.
- **`components/PendingButton.tsx`** : bouton avec spinner + `disabled` pendant une soumission, à utiliser avec `useTransition` plutôt que `<form action={...}>` brut, pour éviter les doubles soumissions et donner un retour visuel.
- **`components/DashboardShell.tsx`** : structure responsive du dashboard (sidebar desktop, tiroir mobile avec overlay sous 768px).
- Chaque page du dashboard (`services`, `rendez-vous`, `parametres`, `abonnement`) a ses propres petits composants client (`services-manager.tsx`, `service-modal.tsx`, `service-row-actions.tsx`, `appointment-modal.tsx`, `business-form.tsx`, `schedule-form.tsx`, `subscribe-button.tsx`) qui appellent la Server Action correspondante via `useTransition`, affichent un toast et désactivent le bouton pendant l'exécution.
- **Design system** (`app/globals.css`) : classes réutilisables `.dash-card`, `.form-label` / `.form-input` / `.form-group` / `.form-error`, `.dash-btn-text` (+ variantes `-danger`/`-positive`), `.dash-badge-clickable`, échelle d'espacement `--space-1` à `--space-7` et d'élévation `--shadow-sm/md/lg`. Utilisez ces classes plutôt que des `style={{}}` inline pour toute nouvelle page.
- Les animations (transitions d'étapes de réservation, apparition en cascade des créneaux, bulle WhatsApp, toasts) respectent `prefers-reduced-motion`.

### Limites connues / non traité dans cette passe

Rate limiting sur les endpoints publics, suivi d'erreurs (Sentry), squelettes de chargement pour les tableaux dashboard, vérification de disponibilité de slug en temps réel, et audit WCAG de contraste complet ne sont pas encore implémentés.

Les rappels 24 h et 1 h sont decouverts dans une fenetre de 30 minutes, adaptee a une execution toutes les 15 minutes. La confirmation est creee au moment de la reservation.

## Verification

```bash
npm run build
```

Les tests de logique seront ajoutes avant toute evolution des creneaux et de la reservation.
