import { type NextRequest } from 'next/server'
import { decrypt, websockets, resolveUser } from '@/server/websockets';
import { logger } from '@/lib/logger';

// Les requêtes d'upgrade WebSocket sont interceptées en amont par next-ws et
// n'atteignent jamais ce handler. Un GET qui arrive ici signifie que les en-têtes
// Upgrade / Connection ont été retirés en route (reverse proxy, CDN) ou qu'un client
// appelle l'URL en HTTP simple : on le signale explicitement plutôt que de laisser
// remonter une erreur opaque.
export const GET = () => {
  return new Response('WebSocket upgrade required', {
    status: 426,
    headers: { Upgrade: 'websocket' },
  });
};

// prévu plus tard
export async function UPGRADE(
  client: import('ws').WebSocket,
  server: import('ws').WebSocketServer,
  request: NextRequest
) {
  logger.info('A client connected');
  const url = new URL(request.url, "http://localhost");
  const token = url.searchParams.get("token");

  if (!token) {
    logger.warn("no token");
    client.close();
    return;
  }

  const user = await resolveUser(decrypt(token));
  if (!user) {
    logger.warn("no user");
    client.close();
    return;
  }

  websockets.set(user.id.toString(), client);
  client.on('close', () => {
    logger.info('A client disconnected');
    websockets.delete(user.id.toString());
  });

  client.on("message", (msg) => {
    try {
        const d = JSON.parse(msg.toString());
        if (d.type === "ping") {
            client.send(JSON.stringify({ type: "pong" }));
        }
    } catch {}
});
}
