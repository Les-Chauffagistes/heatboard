import ExtractWorkername from "../../../../../lib/ExtractWorkername";
import * as Dialog from '@radix-ui/react-dialog';
import HashreateLine from "./HashrateLine";
import { useWorkerStats } from "@/app/hooks/useWorkerStats";
import { CleanWorkerHashrate } from "../../../../../../models/CleanWorkerHashrate";



export default function WorkerPopup({ children, userAddress, worker, }: { children: React.ReactNode, userAddress: string, worker: CleanWorkerHashrate }) {
    const { stats } = useWorkerStats(userAddress, ExtractWorkername.fromPool(worker?.workername ?? "") ?? "Worker sans nom");

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                {children}
            </Dialog.Trigger>
            <Dialog.Overlay style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--background)',
                zIndex: 100
            }} className="DialogOverlay" />
            <Dialog.Content style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 101,
                width: "100%",
                height: "100%",
                marginTop: 30,
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px",
                    marginBottom: "10%",
                }}>
                    <Dialog.Title style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translate(-50%, 0)",
                    }}>{ExtractWorkername.fromPool(worker.workername) ?? "Worker sans nom"}</Dialog.Title>
                    <Dialog.Close className="tertiary" style={{
                        position: "absolute",
                        right: "10px",
                        fontSize: "0.8rem"
                    }}>OK</Dialog.Close>
                </div>
                <Dialog.Description>
                </Dialog.Description>
                <div style={{
                    display: "flex",
                    width: "100%",
                }}>
                    <HashreateLine history={stats} showHashrate1h={false} showWeight />
                </div>
            </Dialog.Content>
        </Dialog.Root>
    )
}