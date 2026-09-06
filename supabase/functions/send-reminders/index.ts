import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const metaToken = Deno.env.get("META_WHATSAPP_TOKEN");
const phoneNumberId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");
const confirmationTemplate = Deno.env.get("META_WHATSAPP_CONFIRMATION_TEMPLATE") ?? "appointment_confirmation";
const reminderTemplate = Deno.env.get("META_WHATSAPP_REMINDER_TEMPLATE") ?? "appointment_reminder";
const appUrl = Deno.env.get("APP_URL");

if (!supabaseUrl || !serviceRoleKey || !metaToken || !phoneNumberId || !appUrl) {
  throw new Error("Configuration WhatsApp ou Supabase incomplete.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

type Rappel = {
  id: string;
  appointment_id: string;
  type_rappel: "confirmation" | "24h" | "1h";
  tentatives: number;
};

type RendezVous = {
  id: string;
  client_nom: string;
  client_telephone: string;
  date_heure: string;
  cancellation_token: string;
  services: { nom: string } | null;
};

function attendreAvantNouvelEssai(tentatives: number): string | null {
  const minutes = [15, 60, 240][tentatives - 1];
  return minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : null;
}

async function planifierRappels(): Promise<void> {
  const maintenant = Date.now();
  const fenetres = [
    { type_rappel: "24h", debut: 23 * 60 + 45, fin: 24 * 60 + 15 },
    { type_rappel: "1h", debut: 45, fin: 75 },
  ] as const;

  for (const fenetre of fenetres) {
    const { data: rendezVous, error } = await supabase
      .from("appointments")
      .select("id")
      .eq("statut", "confirme")
      .gte("date_heure", new Date(maintenant + fenetre.debut * 60_000).toISOString())
      .lt("date_heure", new Date(maintenant + fenetre.fin * 60_000).toISOString());
    if (error) throw error;

    if (rendezVous?.length) {
      const { error: insertionError } = await supabase.from("reminder_logs").upsert(
        rendezVous.map((rendezVous) => ({
          appointment_id: rendezVous.id,
          type_rappel: fenetre.type_rappel,
          statut: "pending",
          next_attempt_at: new Date().toISOString(),
        })),
        { onConflict: "appointment_id,type_rappel", ignoreDuplicates: true },
      );
      if (insertionError) throw insertionError;
    }
  }
}

async function envoyerRappel(rappel: Rappel): Promise<void> {
  const { data: rendezVous, error: rendezVousError } = await supabase
    .from("appointments")
    .select("id, client_nom, client_telephone, date_heure, cancellation_token, services(nom)")
    .eq("id", rappel.appointment_id)
    .eq("statut", "confirme")
    .maybeSingle();

  if (rendezVousError) throw rendezVousError;
  if (!rendezVous) {
    await supabase.from("reminder_logs").update({ statut: "sent", sent_at: new Date().toISOString() }).eq("id", rappel.id);
    return;
  }

  const rdv = rendezVous as RendezVous;
  const dateHeure = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(new Date(rdv.date_heure));
  const lienAnnulation = `${appUrl.replace(/\/$/, "")}/annulation/${rdv.cancellation_token}`;
  const composants = [
    {
      type: "body",
      parameters: [
        { type: "text", text: rdv.client_nom },
        { type: "text", text: rdv.services?.nom ?? "votre rendez-vous" },
        { type: "text", text: dateHeure },
        ...(rappel.type_rappel === "confirmation" ? [{ type: "text", text: lienAnnulation }] : []),
      ],
    },
  ];

  const reponse = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${metaToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: rdv.client_telephone.replace(/^\+/, ""),
      type: "template",
      template: {
        name: rappel.type_rappel === "confirmation" ? confirmationTemplate : reminderTemplate,
        language: { code: "fr" },
        components: composants,
      },
    }),
  });

  const corps = await reponse.json();
  if (!reponse.ok) {
    throw new Error(`Meta ${reponse.status}: ${JSON.stringify(corps).slice(0, 500)}`);
  }

  const { error: logError } = await supabase.from("reminder_logs").update({
    statut: "sent",
    tentatives: rappel.tentatives + 1,
    meta_message_id: corps.messages?.[0]?.id ?? null,
    sent_at: new Date().toISOString(),
    erreur: null,
    next_attempt_at: null,
  }).eq("id", rappel.id);
  if (logError) throw logError;
}

Deno.serve(async () => {
  try {
    await planifierRappels();
    const { data: rappels, error } = await supabase
      .from("reminder_logs")
      .select("id, appointment_id, type_rappel, tentatives")
      .in("statut", ["pending", "failed"])
      .lte("next_attempt_at", new Date().toISOString())
      .lt("tentatives", 3)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) throw error;

    const resultats = await Promise.allSettled((rappels ?? []).map(envoyerRappel));
    const echecs = resultats.filter((resultat) => resultat.status === "rejected");
    await Promise.all(resultats.map(async (resultat, index) => {
      const rappel = (rappels ?? [])[index];
      if (!rappel || resultat.status !== "rejected") return;
      await supabase.from("reminder_logs").update({
        statut: "failed",
        tentatives: rappel.tentatives + 1,
        erreur: String(resultat.reason).slice(0, 1_000),
        next_attempt_at: attendreAvantNouvelEssai(rappel.tentatives + 1),
      }).eq("id", rappel.id);
    }));

    return Response.json({ traites: rappels?.length ?? 0, echecs: echecs.length });
  } catch (error) {
    console.error(error);
    return Response.json({ erreur: "Traitement des rappels impossible." }, { status: 500 });
  }
});
