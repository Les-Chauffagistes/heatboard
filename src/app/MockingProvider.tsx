'use client';

import { useEffect, useState } from "react";

/**
 * Démarre MSW (Mock Service Worker) côté client lorsque NEXT_PUBLIC_MOCK_API=1,
 * afin d'intercepter les appels aux API externes (staging) en développement local
 * sans être bloqué par leur politique CORS.
 *
 * IMPORTANT : `worker.start()` est asynchrone. Les composants enfants déclenchent
 * leurs requêtes (SWR `useSession`, `useEffect` des pages workers/pool, ...) dès
 * leur montage. Si on ne bloque pas le rendu, ces requêtes partent AVANT que le
 * handshake du service worker soit terminé et ne sont donc pas interceptées
 * (particulièrement visible après un rechargement de page). On retarde donc le
 * rendu des enfants jusqu'à ce que le worker soit prêt.
 *
 * Le flag est inliné à la compilation, donc le serveur et le client rendent le
 * même état initial (pas de mismatch d'hydratation). En production / sans le flag,
 * les enfants sont rendus immédiatement sans aucun surcoût.
 *
 * Voir `mocks/handlers.ts` pour la liste des endpoints mockés.
 */
const MOCKING_ENABLED = process.env.NEXT_PUBLIC_MOCK_API === "1";

export default function MockingProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [ready, setReady] = useState(!MOCKING_ENABLED);

  useEffect(() => {
    if (!MOCKING_ENABLED) return;

    let active = true;
    import("../../mocks/browser").then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: "bypass" });
      if (active) setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
