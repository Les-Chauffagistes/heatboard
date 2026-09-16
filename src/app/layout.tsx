// /src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Heatboard — Statistiques de la pool de minage Chauffagistes",
    template: "%s | Heatboard",
  },

  description:
    "Heatboard est le dashboard public des pools de minage Bitcoin Chauffagistes : suivez en temps réel le hashrate de vos workers, les statistiques de la pool et vos récompenses.",

  metadataBase: new URL("https://heatboard.chauffagistes-btc.fr"),

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/brand-icon.png",
    shortcut: "/brand-icon.png",

    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-128.png", sizes: "128x128" },
      { url: "/apple-touch-icon-256.png", sizes: "256x256" },
      { url: "/apple-touch-icon-512.png", sizes: "512x512" },
    ],
  },

  openGraph: {
    title: "Heatboard — Statistiques de la pool de minage Chauffagistes",
    description:
      "Suivez en temps réel le hashrate de vos workers, les statistiques de la pool et vos récompenses.",
    url: "https://heatboard.chauffagistes-btc.fr",
    siteName: "Heatboard",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Heatboard — Les Chauffagistes",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Heatboard — Statistiques de la pool de minage Chauffagistes",
    description:
      "Suivez en temps réel le hashrate de vos workers, les statistiques de la pool et vos récompenses.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Heatboard",
    url: "https://heatboard.chauffagistes-btc.fr",
    description:
      "Dashboard public des pools de minage Bitcoin Chauffagistes : hashrate des workers en temps réel, statistiques de pool, récompenses estimées.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (Web)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "Les Chauffagistes",
      url: "https://chauffagistes-btc.fr",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/config.js" />
        <script defer src="https://umami.chauffagistes-btc.fr/script.js" data-website-id="09f3ce4a-aa69-4353-839b-577f8432954e"></script>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"></link>
        <link rel="manifest" href="manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {children}
    </html>
  );
}
