# Paiements Chariow

TonApp facture 20 USD pour un mois d'acces. Le montant est le prix du produit Chariow et est controle une seconde fois dans le webhook avant toute activation.

## Configuration du compte

1. Creez ou ouvrez le compte marchand sur `https://app.chariow.com`.
2. Creez le produit publie **TonApp Pro - 1 mois** a 20 USD. Choisissez le type **License** et une tarification fixe `one_time`: Chariow permet ainsi plusieurs achats pour un renouvellement. Ne choisissez ni Service, ni Coaching, ni prix libre, car le Checkout API ne les accepte pas.
3. Dans **Settings > API Keys**, creez une cle distincte pour chaque environnement et copiez-la immediatement.
4. Dans **Automations > Pulses**, ajoutez l'URL HTTPS `https://votre-domaine.com/api/chariow/webhook`, filtrez-la sur le produit TonApp Pro, et activez `successful.sale`, `failed.sale` et, si disponible dans votre dashboard, `refunded.sale`.
5. Dans l'onglet **Overview** du Pulse, revelez puis copiez son Signing secret, prefixe par `whsec_`.

Ajoutez les valeurs suivantes uniquement dans `.env.local` et dans les variables de production de votre hebergeur:

```bash
CHARIOW_API_KEY=sk_live_...
CHARIOW_PRODUCT_ID=prd_...
CHARIOW_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

Ne communiquez jamais `CHARIOW_API_KEY` ou `CHARIOW_WEBHOOK_SECRET` au navigateur. Le webhook valide le HMAC-SHA256 de `x-chariow-signature` sur le corps brut, puis relit la vente depuis l'API Chariow avant d'activer un abonnement.

## Base de donnees et types

Appliquez les migrations puis regenerez les types relies au projet Supabase:

```bash
npx supabase db push
npx supabase gen types typescript --linked --schema public > lib/database.types.ts
```

## Test

Chariow ne documente pas de cle ou d'environnement sandbox separe. Utilisez d'abord **Send test pulse** dans la page du Pulse: TonApp valide la signature et accuse reception, sans activer d'abonnement. Pour valider une vente reelle, creez temporairement un produit License publie a faible montant, remplacez `CHARIOW_PRODUCT_ID`, effectuez un paiement Mobile Money ou carte, puis verifiez que `subscription_payments` contient la vente `sal_...` et que l'espace passe a `active`. Les replays restent sans effet sur une vente deja activee.