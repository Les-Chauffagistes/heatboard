import useSWR from "swr";
import { WorkerHistoryRecord } from "../../../models/API Payloads/WorkerHistoryRecord";
import {HistoryAPIClient} from "@chauffagistes/cmn";
import {config} from "@/lib/config";

export function useWorkerStats(userAddress: string, workerName: string, period: "forever" | "daily" = "forever"): {stats: WorkerHistoryRecord[], isLoading: boolean, isError: boolean} {
  const historyAPIClient = new HistoryAPIClient(config.HISTORY_API_URL);
    const { data, error, isLoading } = useSWR(
    ["workerStats", userAddress, workerName, period],
    () => historyAPIClient.getWorkerStatsHistory(userAddress, workerName, period),
    {
      revalidateOnFocus: false,
      refreshInterval: 60_000, // optionnel : refresh chaque minute
    }
  );

  return {
    stats: data ?? [],
    isLoading,
    isError: !!error,
  };
}