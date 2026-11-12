import { BitcoinAPIClient, HistoryAPIClient } from "@chauffagistes/cmn";
import type { HistoryPort, RewardPort } from "./BlockPayoutService";

const SATOSHIS_PER_BTC = 100_000_000;

export function historyAdapter(apiUrl: string): HistoryPort {
    const client = new HistoryAPIClient(apiUrl);
    return {
        async getDistribution(poolAddress, at) {
            const elements = await client.getPoolDistributionAt(poolAddress, at);
            return elements.map(({ workername, part }) => ({ workername, part }));
        },
    };
}

/** Subsidy (hors frais) du block, convertie de BTC en satoshis. La hauteur évite l'imprécision d'une recherche par date. */
export function rewardAdapter(apiUrl: string): RewardPort {
    const client = new BitcoinAPIClient(apiUrl);
    return {
        async getRewardSatoshi(height) {
            const btc = await client.getBtcBlockReward(height);
            return BigInt(Math.round(btc * SATOSHIS_PER_BTC));
        },
    };
}
