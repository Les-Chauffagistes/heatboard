"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import WorkerManager from "./components/WorkersManager";
import InviteFriends from "./components/InviteFriends";
import { getLinkedWorkers, patchUser } from "@/app/api";
import Popup from "@/app/components/Popup";
import WorkerHint from "./components/WorkerHint";
import { LinkedWorkers } from "@/../models/API Payloads/LinkedWorkers";
import { greeting } from "@/lib/Greeting";
import { config } from "@/lib/config";
import { logOut } from "@/lib/auth";
import Image from "next/image";
import { useSession } from "@/app/hooks/useSession";
import "./styles.css";

export default function LoginPage() {
    const {user, isLoading, mutate} = useSession();
    const [open, setOpen] = useState(false);
    const addressRef = useRef<HTMLInputElement>(null);
    const [linkedWorkers, setLinkedWorkers] = useState<LinkedWorkers[] | null>(null);

    const path = usePathname();
    const userAddress = path.split("/")[2];

    useEffect(() => {
        if (!user) return;
        getLinkedWorkers(userAddress).then(d => setLinkedWorkers(d));
    }, [user, userAddress]);

    if (isLoading || user === undefined) return <p className="profile-loading">Relecture de la blockchain...</p>;

    if (user) {
        if (linkedWorkers === null) return <p className="profile-loading">Relecture de la blockchain...</p>;
        async function updateAddress() {
            if (addressRef.current === null) return;
            const newAddress = addressRef.current.value;
            await patchUser({address: newAddress});
            mutate(user ? {...user, address: newAddress} : null, false);
        }

        return (
            <>
                <Popup title="Modifier l'adresse" open={open} setOpen={setOpen} handler={updateAddress}>
                    <input ref={addressRef} type="text" id="popup-input" defaultValue={user.address ?? ""}/>
                </Popup>
                <div className="profile-page">
                    <div className="profile-header">
                        <Image src="/brand-icon.png" alt="logo" width={64} height={64} quality={100}/>
                        <h1>{greeting(user.pseudo)}</h1>
                        <p>Gérez votre compte et vos mineurs</p>
                    </div>
                    <div className="profile-content">
                        <WorkerManager user={user} address={userAddress} setOpen={setOpen}
                                       linkedWorkers={linkedWorkers}/>
                        {linkedWorkers.length > 0 && <WorkerHint linkedWorkers={linkedWorkers}/>}
                        <InviteFriends userAddress={userAddress}/>
                        <button className="danger" style={{margin: "10px auto 0"}} onClick={async () => {
                            await logOut();
                            globalThis.location.reload()
                        }}>Déconnexion
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "70%",
        gap: 30
    }}>
        <h3>Gérez vos machines de minage et votre adresse de paiement</h3>
        <a href={`${config.AUTH_URL}/login?redirect=${config.BASE_URL}${path}`}><button className="primary">Se connecter</button></a>
    </div>;
}
