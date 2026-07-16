import ExtractWorkername from "../../../../../lib/ExtractWorkername";
import { Worker } from "../../../../../../models/Worker";
import HashreateLine from "./HashrateLine";
import { useWorkerStats } from "@/app/hooks/useWorkerStats";



export default function WorkerPannel({ userAddress, worker, showWeight }: { userAddress: string, worker: Worker | null, showWeight: boolean }) {
    const { stats } = useWorkerStats(userAddress, ExtractWorkername.fromPool(worker?.workername ?? "") ?? "Worker sans nom");
    if (!worker) {
        return (
            <div style={{
                flex: 1,
                height: "100%",
            }}>
                <h2 style={{ marginTop: "1rem", marginLeft: "1rem" }}>
                    Sélectionnez un mineur
                </h2>
                <HashreateLine history={[]} showHashrate1h showWeight={showWeight} />
            </div>
        )
    }

    return (
        <div style={{
            flex: 1,
            height: "100%",
        }}>
            <h2 style={{ marginTop: "1rem", marginLeft: "1rem" }}>
                {ExtractWorkername.fromPool(worker.workername) ?? "Worker sans nom"}
            </h2>
            <HashreateLine history={stats} showHashrate1h showWeight={showWeight} />
        </div>
    )
}