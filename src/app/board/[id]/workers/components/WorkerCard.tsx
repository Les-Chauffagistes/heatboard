import ExtractWorkername from "../../../../../lib/ExtractWorkername";
import UnitConverter from "../../../../../lib/UnitConverter";
import formatNumber from "../../../../../lib/NumberFormatter";

import "./hashrateBar.css"
import "./workerCard.css"
import { CleanWorkerHashrate } from "../../../../../../models/CleanWorkerHashrate";

function HashrateBar({ worker }: { worker: CleanWorkerHashrate }) {
    return (
        <div className="hashrate" style={{
            display: "flex",
            borderRadius: 5,
            overflow: "hidden",
            width: "fit-content"
        }}>
            <div className="hashrate-cell">
                <p>{UnitConverter.fromNumberToString(worker.hashrate5m)}</p>
            </div>
            <div className="hashrate-cell">
                <p>{UnitConverter.fromNumberToString(worker.hashrate1h)}</p>
            </div>
            <div className="hashrate-cell">
                <p>{UnitConverter.fromNumberToString(worker.hashrate1d)}</p>
            </div>
        </div>
    )
}

function ShareBar({ worker }: { worker: CleanWorkerHashrate }) {
    return (
        <div className="shares" style={{
            display: "flex",
            borderRadius: 5,
            overflow: "hidden",
            width: "fit-content"
        }}>
            <div className="share-cell">
                <p>{UnitConverter.fromNumberToString(worker.shares)}</p>
            </div>
            <div className="share-cell">
                <p>{UnitConverter.fromNumberToString(worker.bestshare)}</p>
            </div>
        </div>
    )
}

function WeightBar({ worker, btcPrice }: { worker: CleanWorkerHashrate & { weight: number }, btcPrice: number | null }) {
    return (
        <div className="weight" style={{
            display: "flex",
            borderRadius: 5,
            overflow: "hidden",
            width: "fit-content"
        }}>
            <div className="weight-cell">
                <p>{formatNumber(worker.weight)}%</p>
            </div>
            <div className="weight-cell">
                <p>{worker.rewardBtc ? formatNumber(worker.rewardBtc) : "-"} ₿</p>
            </div>
            <div className="weight-cell">
                <p>{worker.rewardBtc && btcPrice ? formatNumber(worker.rewardBtc * btcPrice) : "-"} €</p>
            </div>
        </div>
    )
}

export default function WorkerCard({ worker, btcPrice, isCommunityPool }: { worker: CleanWorkerHashrate & { weight: number }, btcPrice: number | null, isCommunityPool: boolean }) {
    return (
        <div style={{
            border: "1px solid var(--card-outline-color)",
            backgroundColor: "var(--card-background-color)",
            borderRadius: 10,
            color: "var(--foreground)",
            textAlign: "left",
        }}>
            <div style={{
                margin: "10px",
                color: "--var(foreground)",
                overflow: "hidden"
            }}>
                <h3>{ExtractWorkername.fromPool(worker.workername) ?? "Worker sans nom"}</h3>
                <div style={{
                    display: "flex",
                    justifyContent: "start",
                    gap: 20,
                    flexWrap: "wrap",
                    marginTop: 15,
                }}>
                    <div>
                        <p>Hashrates (5m, 1h, 1d)</p>
                        <HashrateBar worker={worker} />
                    </div>
                    <div>
                        <p>Shares (total, best)</p>
                        <ShareBar worker={worker} />
                    </div>
                    {isCommunityPool ?
                        <div>
                            <p>Poids & récompense</p>
                            <WeightBar worker={worker} btcPrice={btcPrice} />
                        </div>:
                        null
                    }
                </div>
            </div>
        </div>
    )
}