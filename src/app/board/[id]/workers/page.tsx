"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { Computer, Search, User } from "lucide-react";

import { getBtcBlockReward, getBtcPrice, getPoolWeight, getPoolStats } from "@/app/api";

import StatsWidgetBar from "../../components/StatsWidgetBar";
import { MainGrid } from "./components/Table";
import { Toolbar } from "./components/Toolbar"
import WorkerPannel from "./components/WorkerPannel";
import WorkerList from "./components/WorkerList";


import UnitConverter from "@/lib/UnitConverter";
import ExtractWorkername from "@/lib/ExtractWorkername";

import { UserInstantStats } from "@/../models/API Payloads/Stats";
import { CleanWorkerHashrate } from "@/../models/CleanWorkerHashrate";
import { Weights } from "@/../models/API Payloads/Weights";
import { Worker } from "@/../models/Worker";

import "./styles.css";

import { HASHRATE_COLUMNS, COMMUNITY_POOL_ADDRESS, isValidHashrateColumn, type HashrateColumn } from "@/app/constants/columns";


const INITIAL_VISIBLE_COLUMNS = new Set(HASHRATE_COLUMNS);

type VisibleColumns = HashrateColumn;

export default function Home() {
    const [userStats, setUserStats] = useState<UserInstantStats | null>(null);
    const [weights, setWeights] = useState<Weights[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<Set<VisibleColumns>>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [bitcoinPrice, setBitcoinPrice] = useState<number | null>(null);
    const [bitcoinBlockReward, setBitcoinBlockReward] = useState<number | null>(null);
    const [orderBy, setOrderBy] = useState<keyof CleanWorkerHashrate>("weight");
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const pathname = usePathname();
    const userAddress = pathname?.split("/")[2];
    const isCommunityPool = userAddress === COMMUNITY_POOL_ADDRESS;

    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = useMemo(() => createTheme({ palette: { mode: prefersDarkMode ? "dark" : "light" } }), [prefersDarkMode]);

    const activeColumnsRef = useRef<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("activeColumns");
        if (stored) {
            try {
                const arr = JSON.parse(stored) as string[];
                activeColumnsRef.current = arr;
                const validColumns = arr.filter(isValidHashrateColumn);
                setVisibleColumns(new Set(validColumns));
            } catch {
                activeColumnsRef.current = [...HASHRATE_COLUMNS];
                setVisibleColumns(new Set(INITIAL_VISIBLE_COLUMNS));
            }
        } else {
            activeColumnsRef.current = [...HASHRATE_COLUMNS];
            setVisibleColumns(new Set(INITIAL_VISIBLE_COLUMNS));
        }
    }, []);

    useEffect(() => {
        if (!userAddress) return;

        const abortController = new AbortController();
        setIsLoading(true);
        setError(null);

        const fetchData = async () => {
            try {
                const [stats, weights, price, blockReward] = await Promise.all([
                    getPoolStats(userAddress),
                    getPoolWeight(userAddress),
                    getBtcPrice(),
                    getBtcBlockReward(),
                ]);

                if (abortController.signal.aborted) return;

                setUserStats(stats);
                setWeights(weights);
                setBitcoinPrice(price.EUR);
                setBitcoinBlockReward(blockReward);
                setIsLoading(false);
            } catch (err) {
                if (!abortController.signal.aborted) {
                    setError(err instanceof Error ? err.message : "Erreur lors du chargement des données");
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => abortController.abort();
    }, [userAddress]);

    const isLargeScreen = useMediaQuery("(min-width: 800px)");

    if (isLoading) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>Préchauffage...</div>;
    }

    if (error) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>Erreur: {error}</div>;
    }

    if (!userStats || !weights.length) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>Aucune donnée</div>;
    }

    const payload = { ...userStats.workers } as (Worker & { weight: number })[];

    for (const [, worker] of Object.entries(payload)) {
        const workerName = ExtractWorkername.fromPool(worker.workername);
        if (workerName) {
            worker.weight = Number.parseFloat(weights.find(w => w.worker_id === workerName)?.avg_weight || "0");
        }
    }

    const handleColumnToggle = (column: VisibleColumns) => {
        const newColumns = new Set(visibleColumns);
        if (newColumns.has(column)) {
            newColumns.delete(column);
        } else {
            newColumns.add(column);
        }
        setVisibleColumns(newColumns);
        localStorage.setItem("activeColumns", JSON.stringify(Array.from(newColumns)));
    };

    function orderHandler(e: ChangeEvent<HTMLSelectElement>) {
        const value = e.target.value;
        if (data.length > 0 && value in data[0]) {
            setOrderBy(value as keyof CleanWorkerHashrate);
        }
    }

    const options = [
        { id: "1m", label: "1 m", checked: visibleColumns.has("hashrate1m"), onChange: () => handleColumnToggle("hashrate1m") },
        { id: "5m", label: "5 m", checked: visibleColumns.has("hashrate5m"), onChange: () => handleColumnToggle("hashrate5m") },
        { id: "1h", label: "1 h", checked: visibleColumns.has("hashrate1hr"), onChange: () => handleColumnToggle("hashrate1hr") },
        { id: "1d", label: "1 j", checked: visibleColumns.has("hashrate1d"), onChange: () => handleColumnToggle("hashrate1d") },
        { id: "7d", label: "7 j", checked: visibleColumns.has("hashrate7d"), onChange: () => handleColumnToggle("hashrate7d") },
    ];

    // Visibility flags for MainGrid
    const isHashrate1mVisible = visibleColumns.has("hashrate1m");
    const isHashrate5mVisible = visibleColumns.has("hashrate5m");
    const isHashrate1hrVisible = visibleColumns.has("hashrate1hr");
    const isHashrate1dVisible = visibleColumns.has("hashrate1d");
    const isHashrate7dVisible = visibleColumns.has("hashrate7d");

    function normalizeHashrate(workers: (Worker & { weight: number })[]): CleanWorkerHashrate[] {
        return Object.entries(workers).map(([, worker]) => {
            const base: CleanWorkerHashrate = {
                workername: worker.workername,
                lastshare: worker.lastshare,
                shares: worker.shares,
                bestshare: worker.bestshare,
                bestever: worker.bestever,
                hashrate1m: UnitConverter.fromStringToNumber(worker.hashrate1m),
                hashrate5m: UnitConverter.fromStringToNumber(worker.hashrate5m),
                hashrate1h: UnitConverter.fromStringToNumber(worker.hashrate1hr),
                hashrate1d: UnitConverter.fromStringToNumber(worker.hashrate1d),
                hashrate7d: UnitConverter.fromStringToNumber(worker.hashrate7d),
                weight: worker.weight
            }
            if (isCommunityPool) {
                base.rewardBtc = bitcoinBlockReward! * (base.weight / 100);
            }
            return base
        }).filter(worker => !!ExtractWorkername.fromPool(worker.workername)); // To test
    }

    const data = normalizeHashrate(payload);

    return (
        <ThemeProvider theme={theme}>
            <div style={{
                overflow: "scroll",
                flex: 1,
                display: "flex",
                flexDirection: "column"
            }} id="page">
                {isLargeScreen ?
                    <>
                        <div style={{
                            margin: "20px 10px"
                        }}>
                            <StatsWidgetBar data={[
                                {
                                    "title": "Personnes",
                                    "value": data.length,
                                    "icon": User
                                },
                                {
                                    "title": "Machines",
                                    "value": userStats.globalStats.workers,
                                    "icon": Computer
                                }
                            ]} />
                        </div>
                        <div style={{
                            display: "flex"
                        }}>
                            <Toolbar options={options} />
                        </div>
                        <div id="main-view" style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: 10 }}>
                            <div style={{ display: "flex", flex: 3 }}>
                                <MainGrid workers={data}
                                    btcPrice={bitcoinPrice}
                                    isCommunityPool={isCommunityPool}
                                    isHashrate1mVisible={isHashrate1mVisible}
                                    isHashrate5mVisible={isHashrate5mVisible}
                                    isHashrate1hrVisible={isHashrate1hrVisible}
                                    isHashrate1dVisible={isHashrate1dVisible}
                                    isHashrate7dVisible={isHashrate7dVisible}
                                    onSelectWorker={setSelectedWorker}
                                />
                            </div>
                            <div style={{ display: "flex", flex: 2, backgroundColor: "var(--card-background-color)", borderRadius: 8, border: "1px solid var(--card-outline-color)" }}>
                                <WorkerPannel worker={selectedWorker} userAddress={userAddress} showWeight={isCommunityPool} />
                            </div>
                        </div>
                    </> :
                    <div style={{
                        margin: "0 10px 10px",
                    }}>
                        <div style={{
                            display: "flex",
                            margin: "10px 0",
                            flexWrap: "wrap",
                        }}>
                            <StatsWidgetBar data={[
                                {
                                    "title": "Personnes",
                                    "value": data.length,
                                    "icon": User
                                },
                                {
                                    "title": "Machines",
                                    "value": userStats.globalStats.workers,
                                    "icon": Computer
                                }
                            ]} />
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "right",
                            alignItems: "stretch",
                            flex: 1,
                            marginTop: 10,
                            marginBottom: 10,
                            gap: 10
                        }}>
                            <div style={{position: "relative", flex: 1, display: "flex", alignItems: "center"}}>
                                <Search style={{position: "absolute", left: 7}} size={18}/>
                                <input style={{
                                    flex: 1,
                                    padding: "10px 15px 10px 30px",
                                    borderRadius: 10,
                                    border: "1px solid var(--card-outline-color)",
                                    backgroundColor: "var(--input-background-color)"
                                }}
                                    placeholder="Workername" type="text" id="search-input" onChange={e => setSearchText(e.target.value)}
                                />
                            </div>
                            <select onChange={orderHandler} style={{
                                padding: "5px 10px",
                                border: "1px solid var(--card-outline-color)",
                                borderRadius: 10,
                                backgroundColor: "var(--card-background-color)",
                            }} defaultValue={"weight"} id="order-by" name="Trier" aria-label="Trier" title="Trier" >
                                <optgroup label="Hashrate">
                                    <option value="hashrate5m">5m</option>
                                    <option value="hashrate1h">1h</option>
                                    <option value="hashrate1d">1d</option>
                                </optgroup>
                                <optgroup label="Shares">
                                    <option value="shares">Shares</option>
                                    <option value="bestshare">Best share</option>
                                </optgroup>
                                <option value="weight"> Poids</option>
                            </select>
                        </div>

                        <WorkerList workers={data} orderBy={orderBy} searchContent={searchText} userAddress={userAddress} btcPrice={bitcoinPrice} isCommunityPool={isCommunityPool} />
                    </div>
                }
            </div>
        </ThemeProvider>
    );
}