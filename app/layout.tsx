import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "TonApp — Réservez en un clic",
  description: "Prise de rendez-vous en ligne avec rappels WhatsApp automatiques",
  manifest: "/manifest.json",
  themeColor: "#14282c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TonApp",
  },
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}