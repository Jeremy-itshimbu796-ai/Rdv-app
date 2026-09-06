# Changelog

## 2026-09-01

### Securite et fiabilite
- Ajout d'une migration Supabase versionnee: schema, indexes, RLS, vue publique minimale et fonctions RPC pour les creneaux et les reservations.
- Les rendez-vous et coordonnees clients ne doivent jamais etre lus directement depuis le navigateur public.
- La contrainte d'exclusion PostgreSQL empeche les chevauchements de rendez-vous confirmes, y compris en cas de requetes concurrentes.
- Ajout des schemas Zod partages pour les donnees publiques et les formulaires dashboard.
- Ajout des tests Node/TypeScript des creneaux, executables avec `npm test`.
- Ajout de l'Edge Function WhatsApp avec logs dedupliques et trois tentatives au maximum.
- Ajout des RPC publiques de consultation et annulation par jeton unique.
- Ajout de la bannière dashboard a J-3 et apres expiration de l'essai gratuit.
- Ajout de la page abonnement et du flux Flutterwave: paiement heberge, webhook verifie et historique de paiements.
