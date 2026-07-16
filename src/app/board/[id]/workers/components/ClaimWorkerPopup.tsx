"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Worker } from "../../../../../../models/Worker";
import ExtractWorkername from "../../../../../lib/ExtractWorkername";



export default function ClaimWorkerPopup({ worker, open, setOpen, code }: { worker: Worker | null, open: boolean, setOpen: (open: boolean) => void, code: number | null }) {
    console.log(code, worker, open)
    if (!code) return null
    if (!worker) return null
    const workerName = ExtractWorkername.fromPool(worker.workername);
    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Overlay style={{
                position: 'absolute',
                inset: 0,
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(10px)",
                zIndex: 100
            }} className="DialogOverlay" />
            <Dialog.Content style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 101,
                width: "80%",
                maxWidth: 550,
                height: "fit-content",
                marginTop: 30,
                backgroundColor: "var(--card-background-color)",
                border: "1px solid var(--card-outline-color)",
                borderRadius: 30,
                padding: 10,
            }}>
                <Dialog.Title style={{
                    textAlign: "center",
                    marginTop: 10,
                }}>{"Réclamer " + workerName}</Dialog.Title>
                <Dialog.Description>
                </Dialog.Description>
                <div style={{
                    width: "100%",
                    padding: 20,
                }}>
                    <p>Pour nous assurer que les machines utilisant le nom « {workerName} » vous appartiennent, utilisez le mot de passe suivant sur au moins un appareil :</p>
                    <h1 style={{textAlign: "center", marginTop: 30}}>{code}</h1>
                </div>
                <Dialog.Close className="primary" style={{margin: "0 15px 15px auto", display: "block"}}>
                    Fermer
                </Dialog.Close>
            </Dialog.Content>
        </Dialog.Root>
    )
}
