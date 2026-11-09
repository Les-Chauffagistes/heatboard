import { COMMUNITY_POOL_ADDRESS } from "@/app/constants/columns";
import { env } from "@/server/env";
import { prisma } from "@/server/Prisma";
import { historyAdapter, rewardAdapter } from "./adapters";
import { BlockPayoutService } from "./BlockPayoutService";

let service: BlockPayoutService | undefined;

/** Service de paiement des blocks, câblé sur la base, history-server et bitcoin-service. */
export function getPayoutService(): BlockPayoutService {
    service ??= new BlockPayoutService({
        db: prisma,
        history: historyAdapter(env.historyApiUrl),
        reward: rewardAdapter(env.bitcoinApiUrl),
        poolAddress: COMMUNITY_POOL_ADDRESS,
    });
    return service;
}
