"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@mui/material";
import WorkerManager from "./components/WorkersManager";
import InviteFriends from "./components/InviteFriends";
import NavbarMenu from "@/app/board/components/NavbarMenu";
import { patchUser } from "@/app/api";
import { useLinkedWorkers } from "@/app/hooks/usePoolData";
import Popup from "@/app/components/Popup";
import WorkerHint from "./components/WorkerHint";
import { greeting } from "@/lib/Greeting";
import { config } from "@/lib/config";
import Image from "next/image";
import { useSession } from "@/app/hooks/useSession";
import "./styles.css";

export default function LoginPage() {
    const {user, isLoading, mutate} = useSession();
    const [open, setOpen] = useState(false);
    const addressRef = useRef<HTMLInputElement>(null);
    const [addressError, setAddressError] = useState<string | null>(null);

    const path = usePathname();
    const userAddress = path.split("/")[2];

    // La navbar bureau (avec son menu thème/déconnexion) est masquée en dessous de
    // 800px : on reproduit ce même menu, ouvrable, en haut à droite de cette page
    // sur mobile pour ne pas perdre l'accès au réglage du thème et à la déconnexion.
    const isLargeScreen = useMediaQuery("(min-width: 800px)");

    const { data: linkedWorkers } = useLinkedWorkers(userAddress, !!user);

    if (isLoading || user === undefined) return <p className="profile-loading">Relecture de la blockchain...</p>;

    if (user) {
        if (!linkedWorkers) return <p className="profile-loading">Relecture de la blockchain...</p>;
        async function updateAddress() {
            if (addressRef.current === null) return false;
            const newAddress = addressRef.current.value.trim();
            try {
                const res = await patchUser({address: newAddress});
                if (res?.error) {
                    setAddressError(res.error === "Invalid data structure" ? "Adresse invalide." : res.error);
                    return false;
                }
            } catch {
                setAddressError("Impossible de joindre le serveur, réessayez.");
                return false;
            }
            setAddressError(null);
            await mutate(user ? {...user, address: newAddress} : null, false);
        }

        function setPopupOpen(value: boolean) {
            if (value) setAddressError(null);
            setOpen(value);
        }

        return (
            <>
                {!isLargeScreen && <NavbarMenu variant="floating" />}
                <Popup title="Modifier l'adresse" open={open} setOpen={setPopupOpen} handler={updateAddress} error={addressError} maxWidth={640}>
                    <input ref={addressRef} type="text" id="popup-input" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" data-lpignore="true" defaultValue={user.address ?? ""}/>
                </Popup>
                <div className="profile-page">
                    <div className="profile-header">
                        <Image src="/brand-icon.png" alt="logo" width={64} height={64} quality={100}/>
                        <h1>{greeting(user.pseudo)}</h1>
                        <p>Gérez votre compte et vos mineurs</p>
                    </div>
                    <div className="profile-content">
                        <WorkerManager user={user} address={userAddress} setOpen={setPopupOpen}
                                       linkedWorkers={linkedWorkers}/>
                        {linkedWorkers.length > 0 && <WorkerHint linkedWorkers={linkedWorkers}/>}
                        <InviteFriends userAddress={userAddress}/>
                    </div>
                </div>
            </>
        );
    }

    return <>
        {!isLargeScreen && <NavbarMenu variant="floating" />}
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            flex: 1,
            gap: 30
        }}>
            <h3 style={{textAlign: "center", maxWidth: "80%"}}>Gérez vos machines de minage et votre adresse de paiement</h3>
            <a href={`${config.AUTH_URL}/login?redirect=${config.BASE_URL}${path}`}><button className="primary">Se connecter</button></a>
        </div>
    </>;
}
