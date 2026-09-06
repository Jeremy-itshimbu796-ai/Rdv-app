import { z } from "zod";

const telephoneSchema = z.string().trim().regex(/^\+[1-9]\d{6,14}$/, "Utilisez un numero WhatsApp international, par exemple +243XXXXXXXXX.");

export const reservationSchema = z.object({
  slug: z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  serviceId: z.string().uuid(),
  date: z.string().date(),
  heure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  clientNom: z.string().trim().min(2, "Le nom est obligatoire.").max(120),
  clientTelephone: telephoneSchema,
});

export const disponibilitesSchema = z.object({
  slug: z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const cancellationTokenSchema = z.string().uuid();

export const serviceSchema = z.object({
  nom: z.string().trim().min(2, "Le nom du service est obligatoire.").max(100),
  prix: z.coerce.number().min(0).max(1_000_000),
  duree: z.coerce.number().int().min(5).max(480).multipleOf(5),
  dateFin: z.union([z.string().date(), z.literal("")]),
  description: z.string().trim().max(500),
  visible: z.boolean(),
});

export const statutRendezVousSchema = z.enum(["annule", "termine", "no_show"]);

export const businessSchema = z.object({
  nom: z.string().trim().min(2, "Le nom de l'activite est obligatoire.").max(120),
  telephone: telephoneSchema,
  adresse: z.string().trim().max(250),
  description: z.string().trim().max(1_000),
});

export const horaireSchema = z.object({
  ferme: z.boolean(),
  ouverture: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  fermeture: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).refine(({ ferme, ouverture, fermeture }) => ferme || ouverture < fermeture, {
  message: "L'heure de fermeture doit etre apres l'heure d'ouverture.",
});

export function lireChaine(formData: FormData, cle: string): string {
  const valeur = formData.get(cle);
  return typeof valeur === "string" ? valeur : "";
}
