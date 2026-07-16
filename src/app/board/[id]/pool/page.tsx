"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { CircleStar, Flame, SatelliteDish } from "lucide-react";
import { getPoolHistory, getPoolStats, getPoolWeight } from "@/app/api";

import HashrateChart from "./components/HashrateChart";
import CombinedWidgetCard from "./components/CombinedWidgetCard";
import ResponsivePieContainer from "./components/ResponsivePieContainer";
import StatsWidgetBar from "../../components/StatsWidgetBar";

import { Weights } from "../../../../../models/API Payloads/Weights";
import { UserInstantStats } from "../../../../../models/API Payloads/Stats";
import { PoolHistoryRecord } from "../../../../../models/API Payloads/PoolHistoryRecord";

import UnitConverter from "../../../../lib/UnitConverter";

import "./styles.css";

import { COMMUNITY_POOL_ADDRESS } from "@/app/constants/columns";

export default function Welcome() {
    const path = usePathname();
    const userAddress = path?.split("/")[2];

    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = useMemo(() => createTheme({ palette: { mode: prefersDarkMode ? "dark" : "light" } }), [prefersDarkMode]);

    const [poolStatsHistory, setPoolStatsHistory] = useState<PoolHistoryRecord[] | null>(null);
    const [poolStats, setPoolStats] = useState<UserInstantStats | null>(null);
    const [weights, setWeights] = useState<Weights[]>([]);

    const isLargeScreen = useMediaQuery("(min-width: 800px)");
    const isCommunityPool = userAddress === COMMUNITY_POOL_ADDRESS;


    useEffect(() => {
        if (!userAddress) return;

        const abortController = new AbortController();

        const fetchData = async () => {
            try {
                const [history, weights, stats] = await Promise.all([
                    getPoolHistory(userAddress),
                    getPoolWeight(userAddress),
                    getPoolStats(userAddress),
                ]);

                if (abortController.signal.aborted) return;

                setPoolStatsHistory(history);
                setWeights(weights);
                setPoolStats(stats);
            } catch (err) {
                if (!abortController.signal.aborted) {
                    console.error("Erreur lors du chargement des données de pool:", err);
                }
            }
        };

        fetchData();

        return () => abortController.abort();
    }, [userAddress]);

    if (poolStatsHistory === null || poolStats === null || weights === null) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>Préchauffage...</div>;
    }

    
    


    return (
        <ThemeProvider theme={theme}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "scroll",
                height: "100%",
                gap: 10
            }}>
                {poolStats ?
                    <div style={{
                        margin: "20px 10px",
                        display: "flex",
                        alignItems: "end",
                        gap: 10,
                        maxWidth: "100%",
                        flexWrap: "wrap",
                    }}>
                        <CombinedWidgetCard data={{
                            title: "Hashrate",
                            values: [
                                {
                                    label: "1m",
                                    value: UnitConverter.fromNumberToString(UnitConverter.fromStringToNumber(poolStats.globalStats.hashrate1m)) + "H/s"
                                },
                                {
                                    label: "1h",
                                    value: UnitConverter.fromNumberToString(UnitConverter.fromStringToNumber(poolStats.globalStats.hashrate1hr)) + "H/s"
                                },
                                {
                                    label: "1d",
                                    value: UnitConverter.fromNumberToString(UnitConverter.fromStringToNumber(poolStats.globalStats.hashrate1d)) + "H/s"
                                },
                                {
                                    label: "7d",
                                    value: UnitConverter.fromNumberToString(UnitConverter.fromStringToNumber(poolStats.globalStats.hashrate7d)) + "H/s"
                                },
                            ],
                            icon: Flame
                        }} />
                        <StatsWidgetBar data={[
                            {
                                title: "Shares",
                                value: UnitConverter.fromNumberToString(poolStats.globalStats.shares),
                                icon: SatelliteDish
                            },
                            {
                                title: "Best Share",
                                value: UnitConverter.fromNumberToString(poolStats.globalStats.bestshare),
                                icon: CircleStar
                            },
                        ]} />
                    </div> : null
                }
                {isLargeScreen ?
                    <div style={{ display: "flex", marginTop: 10, height: 400, gap: 10, margin: "0 10px" }}>
                        <div className="graph" style={{ width: "100%", flex: 1 }}>
                            <ResponsivePieContainer weights={weights} isFake={!isCommunityPool} />
                        </div>
                        <div className="graph" style={{ width: "100%", flex: 3 }}>
                            <HashrateChart data={poolStatsHistory} />
                        </div>
                    </div>
                    :
                    <div className="graph" style={{ width: "calc(100% - 20px)", margin: "0 10px 10px", flex: 1 }}>
                        <ResponsivePieContainer weights={weights} isFake={!isCommunityPool}/>
                    </div>
                }
            </div>
        </ThemeProvider>
    )
}