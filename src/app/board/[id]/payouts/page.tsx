"use client";

import { usePathname } from "next/navigation";
import { COMMUNITY_POOL_ADDRESS } from "@/app/constants/columns";
import { useSession } from "@/app/hooks/useSession";
import { usePayouts } from "@/app/hooks/usePayouts";
import PayoutsView from "@/app/board/components/PayoutsView";
import "@/app/board/components/payouts.css";

export default function PayoutsPage() {
    const isCommunityPool = usePathname()?.split("/")[2] === COMMUNITY_POOL_ADDRESS;
    const { user, isLoading } = useSession();
    const { payouts, mutate } = usePayouts(!!user && isCommunityPool);

    if (!isCommunityPool) {
        return <p className="payouts-empty" style={{ margin: "auto" }}>Le suivi des paiements n&apos;est disponible que sur la pool communautaire.</p>;
    }
    if (isLoading && !user) return <p className="payouts-empty" style={{ margin: "auto" }}>Relecture de la blockchain...</p>;
    if (!user) {
        return <p className="payouts-empty" style={{ margin: "auto" }}>Connectez-vous pour suivre le paiement de vos récompenses.</p>;
    }

    return <PayoutsView payouts={payouts} address={user.address} onChanged={() => { void mutate(); }} />;
}
