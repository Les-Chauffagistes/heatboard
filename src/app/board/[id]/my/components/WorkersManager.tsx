"use client";

import { LinkedWorkers } from "../../../../../../models/API Payloads/LinkedWorkers";
import Link from "next/link";
import { SessionUser } from "@/app/hooks/useSession";
import { Computer, Wallet } from "lucide-react";

export default function WorkerManager({ user, linkedWorkers, address, setOpen }: Readonly<{
    user: SessionUser,
    linkedWorkers: LinkedWorkers[],
    address: string,
    setOpen: (open: boolean) => void
}>) {

    if (!user.pseudo) return null;

    if (linkedWorkers.length === 0) {
        return (
            <div className="profile-section">
                <div className="profile-empty">
                    <p>Aucun workername pour le moment. Associez un mineur et définissez votre adresse de paiement.</p>
                    <Link href={`/start/${address}`}>
                        <button className="primary">Commencer</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="profile-section">
                <div className="profile-section-header">
                    <div className="profile-section-icon"><Computer size={18} /></div>
                    <h3>Workername</h3>
                </div>
                <div className="profile-row">
                    <span className="profile-row-label">Nom</span>
                    <span className="profile-row-value">{linkedWorkers[0].workername}</span>
                    {linkedWorkers[0].status === "pending" &&
                        <span className="profile-row-action">
                            <Link href={`/start/${address}`}>
                                <button className="tertiary">Terminer</button>
                            </Link>
                        </span>
                    }
                </div>
            </div>

            <div className="profile-section">
                <div className="profile-section-header">
                    <div className="profile-section-icon"><Wallet size={18} /></div>
                    <h3>Adresse de réception</h3>
                </div>
                <div className="profile-row">
                    <span className="profile-row-value break">{user.address ?? "Non définie"}</span>
                    <span className="profile-row-action">
                        <button onClick={() => setOpen(true)} className="tertiary">Modifier</button>
                    </span>
                </div>
            </div>
        </>
    );
}
