import useSWR from "swr";
import type { Payouts } from "@/../models/API Payloads/Payouts";

/** Paiements de blocks du membre connecté (désactivé tant que `enabled` est faux). */
export function usePayouts(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<Payouts>(
        enabled ? "/api/payouts" : null,
        async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`payouts: ${res.status}`);
            return res.json();
        },
        { revalidateOnFocus: true, refreshInterval: 300_000, shouldRetryOnError: false },
    );

    return { payouts: data, isLoading, isError: !!error, mutate };
}

export async function confirmPayoutAddress(address?: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const res = await fetch("/api/payouts/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address === undefined ? {} : { address }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error ?? "Une erreur est survenue, réessayez plus tard." };
}
