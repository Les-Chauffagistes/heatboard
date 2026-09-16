// /src/app/layout.tsx

import "./globals.css";

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
      </head>
      {children}
    </html>
  );
}
