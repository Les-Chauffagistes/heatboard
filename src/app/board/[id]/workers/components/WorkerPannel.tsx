import ExtractWorkername from "../../../../../lib/ExtractWorkername";
import { Worker } from "../../../../../../models/Worker";
import HashreateLine from "./HashrateLine";
import { useWorkerStats } from "@/app/hooks/useWorkerStats";



export default function WorkerPannel({ userAddress, worker, showWeight, compact }: { userAddress: string, worker: Worker | null, showWeight: boolean, compact?: boolean }) {
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
                <HashreateLine history={[]} showHashrate1h showWeight={showWeight} compact={compact} />
            </div>
        )
    }

    // Pas de titre ici, sur aucune des deux vues : le nom du worker est déjà
    // affiché juste au-dessus (colonne "Nom" du tableau desktop, en-tête de la
    // ligne mobile) — le répéter n'ajoutait qu'une redondance visuelle.
    return (
        <div style={{
            flex: 1,
            height: "100%",
        }}>
            <HashreateLine history={stats} showHashrate1h showWeight={showWeight} compact={compact} />
        </div>
    )
}