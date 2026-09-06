export type Notification = {
  id: string;
  message: string;
  createdAt: string;
};

/**
 * Aucune table de notifications n'existe encore en base. Fonction isolee
 * pour brancher facilement une vraie source (table Supabase + rpc) plus tard
 * sans toucher au composant qui l'utilise.
 */
export async function chargerNotifications(): Promise<Notification[]> {
  return [];
}
