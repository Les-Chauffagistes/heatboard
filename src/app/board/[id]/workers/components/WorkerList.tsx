import { useState } from "react";
import { CleanWorkerHashrate } from "../../../../../../models/CleanWorkerHashrate"
import WorkerListRow from "./WorkerListRow"

export type WorkerListProps = {
    workers: (CleanWorkerHashrate & { weight: number })[],
    orderBy: keyof (CleanWorkerHashrate & { weight: number }),
    searchContent?: string,
    userAddress: string,
    btcPrice: number | null,
    isCommunityPool: boolean
}

export default function WorkerList({ workers, orderBy, searchContent = "", userAddress, btcPrice = null, isCommunityPool }: Readonly<WorkerListProps>) {
    // Un seul worker déplié à la fois, comme le comportement du tableau desktop.
    const [expandedName, setExpandedName] = useState<string | null>(null);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 10
        }}>
            {[...workers].sort((a, b) => Number(b[orderBy]) - Number(a[orderBy])).filter(worker => worker.workername.toLowerCase().includes(searchContent.toLowerCase())).map(worker => {
                return (
                    <WorkerListRow
                        key={worker.workername}
                        worker={worker}
                        userAddress={userAddress}
                        btcPrice={btcPrice}
                        isCommunityPool={isCommunityPool}
                        expanded={expandedName === worker.workername}
                        onToggle={() => setExpandedName(prev => prev === worker.workername ? null : worker.workername)}
                    />
                )
            })}
        </div>
    )
}
