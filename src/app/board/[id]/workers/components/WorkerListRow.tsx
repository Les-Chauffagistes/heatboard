"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import ExtractWorkername from "@/lib/ExtractWorkername";
import UnitConverter from "@/lib/UnitConverter";
import formatNumber from "@/lib/NumberFormatter";
import WorkerPannel from "./WorkerPannel";
import { CleanWorkerHashrate } from "@/../models/CleanWorkerHashrate";
import { Worker } from "@/../models/Worker";
import "./workerListRow.css";

export default function WorkerListRow({
    worker,
    userAddress,
    btcPrice,
    isCommunityPool,
    expanded,
    onToggle,
}: Readonly<{
    worker: CleanWorkerHashrate & { weight: number };
    userAddress: string;
    btcPrice: number | null;
    isCommunityPool: boolean;
    expanded: boolean;
    onToggle: () => void;
}>) {
    const workerName = ExtractWorkername.fromPool(worker.workername) ?? "Worker sans nom";
    const isOnline = worker.hashrate1m > 0;

    // Le contenu (graphe + fetch de l'historique via WorkerPannel) n'est monté
    // qu'à la première ouverture, puis reste monté pour permettre l'animation de
    // fermeture — sinon la div n'a plus rien à l'intérieur pour se refermer sur.
    const [hasOpened, setHasOpened] = useState(expanded);
    useEffect(() => {
        if (expanded) setHasOpened(true);
    }, [expanded]);

    // Centre la vue sur la carte une fois dépliée, en attendant la fin de
    // l'animation (250ms, cf. .worker-row-detail-collapse) pour centrer sur sa
    // hauteur finale plutôt que sur sa hauteur encore repliée.
    const wrapRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!expanded) return;
        const timer = setTimeout(() => {
            wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 260);
        return () => clearTimeout(timer);
    }, [expanded]);

    const rewardLabel = !worker.rewardBtc
        ? "—"
        : btcPrice
            ? `${formatNumber(worker.rewardBtc * btcPrice)} €`
            : `${formatNumber(worker.rewardBtc)} ₿`;

    return (
        <div className="worker-row-wrap" ref={wrapRef}>
            <button type="button" className="worker-row" onClick={onToggle} aria-expanded={expanded}>
                <span className={`worker-row-status ${isOnline ? "online" : ""}`} aria-hidden />
                <span className="worker-row-name">{workerName}</span>

                <span className="worker-row-stats">
                    <span className="worker-row-stat">
                        <span className="worker-row-stat-value">{UnitConverter.fromNumberToString(worker.hashrate1h)}</span>
                        <span className="worker-row-stat-label">1h</span>
                    </span>
                    {isCommunityPool && (
                        <span className="worker-row-stat">
                            <span className="worker-row-stat-value">{rewardLabel}</span>
                            <span className="worker-row-stat-label">Récompense</span>
                        </span>
                    )}
                </span>

                <ChevronDown size={18} className={`worker-row-chevron ${expanded ? "expanded" : ""}`} aria-hidden />
            </button>

            <div className={`worker-row-detail-collapse ${expanded ? "expanded" : ""}`}>
                <div className="worker-row-detail-collapse-inner">
                    {hasOpened && (
                        <div className="worker-row-detail">
                            <div className="worker-row-detail-stats">
                                <div className="worker-row-detail-stat">
                                    <span className="worker-row-detail-stat-value">{UnitConverter.fromNumberToString(worker.shares)}</span>
                                    <span className="worker-row-detail-stat-label">Shares</span>
                                </div>
                                <div className="worker-row-detail-stat">
                                    <span className="worker-row-detail-stat-value">{UnitConverter.fromNumberToString(worker.bestshare)}</span>
                                    <span className="worker-row-detail-stat-label">Best Share</span>
                                </div>
                                {isCommunityPool && (
                                    <div className="worker-row-detail-stat">
                                        <span className="worker-row-detail-stat-value">{formatNumber(worker.weight)}%</span>
                                        <span className="worker-row-detail-stat-label">Poids</span>
                                    </div>
                                )}
                            </div>
                            <div className="worker-row-detail-chart">
                                <WorkerPannel
                                    userAddress={userAddress}
                                    worker={worker as unknown as Worker}
                                    showWeight={isCommunityPool}
                                    compact
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
