import * as crypto from "node:crypto";
import { prisma } from './Prisma';


export const websockets = new Map<string, import('ws').WebSocket>()

const KEY = crypto.createHash("sha256")
  .update(process.env.SESSION_PASSWORD!)
  .digest(); // 32 bytes

export function encrypt(data: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decrypt(token: string) {
  const raw = Buffer.from(token, "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(enc), decipher.final()]);
  return out.toString("utf8");
}

export async function resolveUser(id: string | number) {
    return await prisma.user.findUnique({where: {id: id.toString()}})
}