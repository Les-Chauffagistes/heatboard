import { prisma } from "@/server/Prisma";
import { NextResponse } from "next/server";
import randint from "../../../../../lib/Random";
import { getMe } from "@/lib/auth";
import { getServerCookieHeader } from "@/lib/auth.server";


export const GET = async (_req: Request, { params }: { params: Promise<{ address: string, workername: string }> }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const p = await params;

    const result = await prisma.workernames.count({
      where: {
        OR: [{ status: "done" }, { status: "pending" }],
        workername: p.workername,
        btc_address: p.address
      }
    })

    if (result) return NextResponse.json({ exists: true }, { status: 200 });
    else return NextResponse.json({ exists: false }, { status: 200 });

  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export const POST = async (req: Request, { params }: { params: Promise<{ address: string, workername: string }> }) => {
  const user = await getMe(await getServerCookieHeader());
  const p = await params;
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }
  if (!p.workername) {
    return NextResponse.json({ error: "workername required" }, { status: 400 });
  }

  // On vérifie si le nom est déjà réservé
  const reserved = await prisma.workernames.count({
    where: {
      status: "done",
      workername: p.workername,
      btc_address: p.address
    }
  })
  if (reserved) return NextResponse.json({ error: "Already exists" }, { status: 400 });

  // On vérifie si l'utilisateur a déjà réserver un workername
  const userReserved = await prisma.workernames.count({
    where: {
      user: user.user_id,
      btc_address: p.address,
      status: "done"
    }
  })
  if (userReserved) return NextResponse.json({ error: "Max limit" }, { status: 400 });

  // On vérifie si l'utilisateur a déjà une réservation de statut 'pending'
  const pending = await prisma.workernames.findFirst({
    where: {
      user: user.user_id,
      btc_address: p.address,
      status: "pending"
    }
  })

  // Un utilisateur ne peut pas faire 2 réservations en même temps. Est ce qu'on annule immédiatement l'ancienne procédure et on la remplace par la nouvelle ? ou en renvoit une erreur ?

  // Pour le moment on renvoie une erreur
  if (pending) {
    return NextResponse.json({ error: "Pending" }, { status: 400 });
  }


  const code = randint(111111, 999999);
  await prisma.workernames.create({ data: { workername: p.workername, user: user.user_id, btc_address: p.address, code: code.toString() } })
  return NextResponse.json({ type: 'new', code: code })

}