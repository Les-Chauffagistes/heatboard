'use client';

import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import MockingProvider from '@/app/MockingProvider';

// Polices de l'app : chargées ici car `ThemeBody` est le seul point commun à
// toutes les routes (chacune fournit son propre <body> via ce composant,
// cf. layout.tsx). Les variables CSS sont consommées par `font-family` dans
// globals.css (et par endroits ciblés via `.className` — Code.tsx,
// PoolStatsStrip.tsx). `--font-mono` en variable (pas juste `.className`) est
// nécessaire pour atteindre le texte SVG rendu en interne par les graphiques
// MUI (axes, tooltips) : on ne peut pas leur passer une className directement,
// seule une variable CSS traverse la cascade jusqu'à leurs éléments.
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: '500', variable: '--font-mono' });

interface ThemeBodyProps {
  readonly children: React.ReactNode;
  readonly className: string;
}

export default function ThemeBody({ children, className }: Readonly<ThemeBodyProps>) {
  // Pas de `style` inline ici : `globals.css` a déjà une règle `body { background:
  // var(--background); }`. La version précédente dupliquait ce fond en inline
  // avec une couleur codée en dur (#ce8415ff, l'orange de la navbar mobile au
  // lieu du vrai fond de page) — sur les pages board (position: fixed, body a
  // une hauteur de 0), ce fond ne devrait jamais se voir, mais Chromium propage
  // quand même sa couleur au canvas du viewport dans les zones vides, ce qui
  // rendait l'erreur visible. Passer par la règle CSS externe plutôt qu'un style
  // inline évite ce souci de propagation (vérifié : plus d'aplat visible).
  return (
    <body className={`${archivo.variable} ${ibmPlexMono.variable} ${className}`}>
      <MockingProvider>{children}</MockingProvider>
    </body>
  );
}
