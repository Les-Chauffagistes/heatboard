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

const HEARTBEAT_MS = 25_000;

export async function UPGRADE(
  client: import('ws').WebSocket,
  server: import('ws').WebSocketServer,
  request: NextRequest
) {
  logger.info('A client connected');
  const url = new URL(request.url, "http://localhost");
  const token = url.searchParams.get("token");

  // Enregistré avant tout `await` : un client qui se ferme pendant la résolution
  // de l'utilisateur ne doit pas rester dans la map.
  let userId: string | null = null;
  let alive = true;
  const heartbeat = setInterval(() => {
    if (!alive) return client.terminate();
    alive = false;
    client.ping();
  }, HEARTBEAT_MS);
  client.on('pong', () => { alive = true; });
  client.on('close', () => {
    clearInterval(heartbeat);
    logger.info('A client disconnected');
    // Ne retire que sa propre entrée : une reconnexion a pu la remplacer entre-temps.
    if (userId && websockets.get(userId) === client) websockets.delete(userId);
  });

  if (!token) {
    logger.warn("no token");
    client.close();
    return;
  }

  let user;
  try {
    user = await resolveUser(decrypt(token));
  } catch {
    logger.warn("invalid token");
    client.close();
    return;
  }
  if (!user) {
    logger.warn("no user");
    client.close();
    return;
  }
  if (client.readyState !== client.OPEN) return;

  userId = user.id.toString();
  const previous = websockets.get(userId);
  websockets.set(userId, client);
  if (previous && previous !== client) previous.close();

  client.on("message", (msg) => {
    try {
        let raw: Buffer;
        if (Array.isArray(msg)) raw = Buffer.concat(msg);
        else if (msg instanceof ArrayBuffer) raw = Buffer.from(msg);
        else raw = msg;
        const d = JSON.parse(raw.toString("utf8"));
        if (d.type === "ping") {
            client.send(JSON.stringify({ type: "pong" }));
        }
    } catch {}
});
}
