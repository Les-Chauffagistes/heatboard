import { NextResponse, type NextRequest } from "next/server";
import { extractTraceContext, withTraceContext } from "@chauffagistes/cmn/tracing";
import { logger } from "@/lib/logger";

// Le middleware Next.js s'exécute avant le handler et ne voit jamais la
// réponse : pas de statut/durée possible ici (contrairement à
// withRequestLogging, applicable route par route). Ce middleware se limite
// donc à un log d'accès "requête reçue", dans le contexte de trace
// (`traceparent`) porté par la requête entrante.
// process.stdout (utilisé par le logger) n'existe pas sur l'Edge runtime — export
// séparé, PAS une clé de `config` (le schéma de `config` est strict et n'accepte
// que matcher/regions/unstable_allowDynamic ; y mettre `runtime` est ignoré en
// silence et le middleware n'est jamais enregistré).
export const runtime = "nodejs";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};

export function middleware(request: NextRequest) {
  const ctx = extractTraceContext(request.headers);

  return withTraceContext(ctx, () => {
    logger.info("requête reçue", {
      method: request.method,
      path: request.nextUrl.pathname,
    });

    return NextResponse.next();
  });
}
