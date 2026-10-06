"use client";

import { useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Computer } from "lucide-react";

import { useTheme } from "@/app/hooks/useTheme";
import HashrateChart from "@/app/board/[id]/pool/components/HashrateChart";
import ResponsivePieContainer from "@/app/board/[id]/pool/components/ResponsivePieContainer";
import WidgetCard from "@/app/board/components/WidgetCard";
import WorkerCard from "@/app/board/[id]/workers/components/WorkerCard";
import { PoolHistoryRecord } from "../../../../models/API Payloads/PoolHistoryRecord";
import { components } from "@chauffagistes/cmn";
import { CleanWorkerHashrate } from "../../../../models/CleanWorkerHashrate";
import styles from "./landing.module.css";

// Données fixes (pas de Math.random/Date.now) pour un rendu identique entre le
// SSR et l'hydratation client de ces composants réels du dashboard.
const HISTORY_BASE_TS = Date.parse("2026-09-01T00:00:00Z");

const MOCK_POOL_HISTORY: PoolHistoryRecord[] = Array.from({ length: 14 }, (_, i) => {
    const wave = Math.sin(i / 2) * 0.35e15 + Math.cos(i / 3) * 0.12e15;
    const trend = i * 0.02e15;
    return {
        timestamp: new Date(HISTORY_BASE_TS + i * 12 * 3600 * 1000).toISOString(),
        avg_hashrate1h: 3.1e15 + wave + trend,
        avg_hashrate1d: 3.1e15 + wave * 0.6 + trend,
    };
});

const MOCK_WEIGHTS: components["schemas"]["PoolDistributionElement"][] = [
    { workername: "rig-01", diff_sum: 32, part: 0.32, shares_ok: 32, shares_ko: 0 },
    { workername: "rig-02", diff_sum: 24, part: 0.24, shares_ok: 24, shares_ko: 0 },
    { workername: "antminer-s19", diff_sum: 18, part: 0.18, shares_ok: 18, shares_ko: 0 },
    { workername: "whatsminer-m30", diff_sum: 14, part: 0.14, shares_ok: 14, shares_ko: 0 },
    { workername: "s21-pro", diff_sum: 12, part: 0.12, shares_ok: 12, shares_ko: 0 },
];

const MOCK_WORKER: CleanWorkerHashrate & { weight: number } = {
    workername: "bc1qexemple9d2f.rig-01",
    hashrate1m: 92_000_000_000_000,
    hashrate5m: 90_000_000_000_000,
    hashrate1h: 88_000_000_000_000,
    hashrate1d: 91_000_000_000_000,
    hashrate7d: 89_000_000_000_000,
    lastshare: "2026-09-16T10:00:00Z",
    shares: 1_250_000_000,
    bestshare: 60_000_000_000,
    bestever: 610_000_000_000,
    weight: 18.5,
    rewardBtc: 3.125 * 0.185,
};

export default function ComponentShowcase() {
    const { isDark } = useTheme();
    const muiTheme = useMemo(() => createTheme({ palette: { mode: isDark ? "dark" : "light" } }), [isDark]);

    return (
        <section style={{ background: "var(--background-alt)", paddingTop: 80, paddingBottom: 120 }}>
            <div className={styles.container} style={{ textAlign: "center" }}>
                <div className={styles.fadeUp} style={{ maxWidth: 560, margin: "0 auto" }}>
                    <h2>Des métriques pertinentes</h2>
                    <p style={{ marginTop: 12, color: "var(--secondary-white-text-color)" }}>
                        Les informations essentielles sont disponibles sur votre dashboard.
                    </p>
                </div>

                <ThemeProvider theme={muiTheme}>
                    <div className={styles.showcaseStage}>
                        <div className={styles.showcaseGrid}>
                            <div className={`${styles.showcaseHero} ${styles.showcaseGraphWrap}`}>
                                <HashrateChart data={MOCK_POOL_HISTORY} />
                            </div>

                            <div className={`${styles.showcaseTile} ${styles.showcaseTileCenter}`}>
                                <WidgetCard title="Machines" value={24} Icon={Computer} />
                            </div>

                            <div className={`${styles.showcaseTile} ${styles.showcaseGraphWrap}`}>
                                <ResponsivePieContainer weights={MOCK_WEIGHTS} isFake={false} />
                            </div>

                            <div className={`${styles.showcaseTile} ${styles.showcaseTileWide}`}>
                                <WorkerCard worker={MOCK_WORKER} btcPrice={64000} isCommunityPool />
                            </div>
                        </div>
                    </div>
                </ThemeProvider>
            </div>
        </section>
    );
}
