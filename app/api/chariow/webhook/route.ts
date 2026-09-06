import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { Json } from "@/lib/database.types";

const PRIX_MENSUEL_USD = 20;

type ChariowPulse = {
  event?: string;
  sale?: {
    id?: string;
    custom_metadata?: { reference_interne?: string };
  };
};

type ChariowSale = {
  id?: string;
  status?: string;
  amount?: { value?: number; currency?: string };
  product?: { id?: string };
  payment?: {
    transaction_id?: string;
    gateway?: string;
    method?: { name?: string; type?: string };
    amount?: { value?: number; currency?: string };
  };
};

function signatureValide(corps: string, signature: string | null, secret: string): boolean {
  if (!signature?.startsWith("sha256=")) return false;

  const attendue = `sha256=${createHmac("sha256", secret).update(corps).digest("hex")}`;
  const recue = Buffer.from(signature);
  const attendueBuffer = Buffer.from(attendue);
  return recue.length === attendueBuffer.length && timingSafeEqual(recue, attendueBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.CHARIOW_WEBHOOK_SECRET;
  const corps = await request.text();
  if (!secret || !signatureValide(corps, request.headers.get("x-chariow-signature"), secret)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let pulse: ChariowPulse;
  try {
    pulse = JSON.parse(corps) as ChariowPulse;
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide" }, { status: 400 });
  }

  const evenement = request.headers.get("x-pulse-event");
  const deliveryId = request.headers.get("x-pulse-delivery-id");
  if (!evenement || evenement !== pulse.event) {
    return NextResponse.json({ error: "Evenement invalide" }, { status: 400 });
  }

  // Chariow test pulses intentionally have no delivery ID and must never alter subscriptions.
  if (!deliveryId) return NextResponse.json({ received: true });

  const saleId = pulse.sale?.id;
  const reference = pulse.sale?.custom_metadata?.reference_interne;
  if (!saleId || !reference) return NextResponse.json({ received: true });

  const supabase = createAdminClient();
  if (evenement === "failed.sale" || evenement === "refunded.sale") {
    const { error } = await supabase
      .from("subscription_payments")
      .update({
        statut: evenement === "refunded.sale" ? "refunded" : "failed",
        webhook_delivery_id: deliveryId,
        payload_fournisseur: pulse as unknown as Json,
      })
      .eq("fournisseur_sale_id", saleId)
      .neq("statut", "successful");
    if (error) return NextResponse.json({ error: "Erreur de base de donnees" }, { status: 500 });
    return NextResponse.json({ received: true });
  }

  if (evenement !== "successful.sale") return NextResponse.json({ received: true });

  const apiKey = process.env.CHARIOW_API_KEY;
  const productId = process.env.CHARIOW_PRODUCT_ID;
  if (!apiKey || !productId) return NextResponse.json({ error: "Configuration incomplete" }, { status: 500 });

  const verification = await fetch(`https://api.chariow.com/v1/sales/${encodeURIComponent(saleId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const reponse = await verification.json().catch(() => null);
  const vente = reponse?.data as ChariowSale | undefined;
  if (
    !verification.ok ||
    vente?.id !== saleId ||
    vente.status !== "completed" ||
    vente.product?.id !== productId ||
    Number(vente.amount?.value) !== PRIX_MENSUEL_USD ||
    vente.amount?.currency !== "USD"
  ) {
    return NextResponse.json({ error: "Vente Chariow invalide" }, { status: 400 });
  }

  const { error } = await supabase.rpc("activer_abonnement", {
    p_reference_interne: reference,
    p_fournisseur_sale_id: saleId,
    p_fournisseur_payment_id: vente.payment?.transaction_id ?? "",
    p_methode_paiement: vente.payment?.method?.name ?? vente.payment?.method?.type ?? "chariow",
    p_fournisseur_gateway: vente.payment?.gateway ?? "chariow",
    p_montant_paye: vente.payment?.amount?.value ?? vente.amount.value ?? PRIX_MENSUEL_USD,
    p_devise_payee: vente.payment?.amount?.currency ?? vente.amount.currency ?? "USD",
    p_webhook_delivery_id: deliveryId,
    p_payload_fournisseur: pulse as unknown as Json,
  });
  if (error) return NextResponse.json({ error: "Erreur de base de donnees" }, { status: 500 });

  return NextResponse.json({ received: true });
}