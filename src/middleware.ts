import { NextResponse, type NextRequest } from "next/server";
import { extractTraceContext, withTraceContext } from "@chauffagistes/cmn/tracing";
import { logger } from "@/lib/logger";

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