import useSWR, { type SWRConfiguration } from "swr";
import { BitcoinAPIClient, HistoryAPIClient, PoolAPIClient } from "@chauffagistes/cmn";
import { config } from "@/lib/config";
import { getLinkedWorkers } from "@/app/api";

// Les clés SWR sont partagées entre /my, /workers et /pool : naviguer d'une page à l'autre
// affiche aussitôt les données en cache, puis les revalide en arrière-plan.
const poolConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    refreshInterval: 60_000,
    dedupingInterval: 30_000,
};

const slowConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    refreshInterval: 300_000,
    dedupingInterval: 60_000,
    shouldRetryOnError: false,
};

export function usePoolStats(address: string | undefined) {
    return useSWR(
        address ? ["poolStats", address] : null,
        () => new PoolAPIClient(config.API_URL).getPoolStats(address!),
        poolConfig,
    );
}

export function usePoolWeights(address: string | undefined) {
    return useSWR(
        address ? ["poolWeights", address] : null,
        () => new PoolAPIClient(config.API_URL).getPoolShareDistribution(address!),
        poolConfig,
    );
}

export function usePoolHistory(address: string | undefined) {
    return useSWR(
        address ? ["poolHistory", address] : null,
        () => new HistoryAPIClient(config.HISTORY_API_URL).getPoolStatsHistory(address!),
        poolConfig,
    );
}

export function useBtcPrice() {
    return useSWR("btcPrice", () => new BitcoinAPIClient(config.BITCOIN_API_URL).getBtcPrice(), slowConfig);
}

export function useBtcBlockReward() {
    return useSWR("btcBlockReward", () => new BitcoinAPIClient(config.BITCOIN_API_URL).getBtcBlockReward(), slowConfig);
}

export function useLinkedWorkers(address: string | undefined, enabled: boolean) {
    return useSWR(
        enabled && address ? ["linkedWorkers", address] : null,
        () => getLinkedWorkers(address!),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    );
}
