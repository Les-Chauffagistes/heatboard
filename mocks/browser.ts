import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Instance MSW pour le navigateur. Voir src/app/MockingProvider.tsx pour le
 * point d'activation (variable d'env NEXT_PUBLIC_MOCK_API).
 */
export const worker = setupWorker(...handlers);
