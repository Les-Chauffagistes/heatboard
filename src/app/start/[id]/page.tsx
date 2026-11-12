"use client";

import { getLinkedWorkers, getUserToken, registerWorkername } from "@/app/api";
import { useSession } from "@/app/hooks/useSession";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LinkedWorkers } from "../../../../models/API Payloads/LinkedWorkers";
import S1 from "./steps/S1";
import S2 from "./steps/S2";
import S3 from "./steps/S3";
import S4 from "./steps/S4";
import Stepper from "./components/Stepper";
import StartBackground from "./components/StartBackground";

import "./styles.css";
import { config } from "@/lib/config";

const FLASH_MS = 900;
const STEP_LABELS = ["Workername", "Mineur", "Paiement"];

export default function StatPage() {
    const path = usePathname();

    const { user, isLoading } = useSession();
    const [userToken, setUserToken] = useState<string | null>(null);

    const [linkedWorkers, setLinkedWorkers] = useState<LinkedWorkers[] | null>(null);
    // Étape minimale atteinte localement (la session et la liste des workers peuvent être en retard).
    const [reached, setReached] = useState(1);
    const [flash, setFlash] = useState(false);
    const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(flashTimer.current), []);

    const userAddress = path.split("/")[2];

    useEffect(() => {
        if (!isLoading && !user) {
            window.location.href = `${config.AUTH_URL}/login?redirect=${config.BASE_URL}${path}`;
        }
    }, [isLoading, user, path]);

    useEffect(() => {
        if (!user) {
            setLinkedWorkers(null);
            setUserToken(null);
            return;
        }
        void getLinkedWorkers(userAddress).then(setLinkedWorkers);
        void getUserToken().then(setUserToken);
    }, [user, userAddress]);

    if (isLoading || !user || linkedWorkers === null) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>Préchauffage...</div>;
    }

    const association = linkedWorkers[0];

    let derived = 1;
    if (association) derived = 2;
    if (association?.status === "done") derived = 3;
    if (association?.status === "done" && user.address) derived = 4;
    const step = Math.max(derived, reached);

    // Laisse l'éclat de chaleur se jouer avant de changer de carte (sauf si l'animation est réduite).
    function handleMinerConnected() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setReached(3);
            return;
        }
        setFlash(true);
        flashTimer.current = setTimeout(() => {
            setFlash(false);
            setReached(3);
        }, FLASH_MS);
    }

    async function handleWorkername(workername: string): Promise<string | undefined> {
        const result = await registerWorkername(userAddress, workername);
        if ("error" in result) {
            return result.error;
        }
        setLinkedWorkers(await getLinkedWorkers(userAddress));
        setReached(2);
    }

    return (
        <StartBackground step={step} flash={flash}>
            <h1 id="start-title">Connecter un mineur</h1>

            <Stepper labels={STEP_LABELS} current={step} />

            <div id="card-container">
                <div key={step} className="card">
                    {step === 1 && <S1 userAddress={userAddress} next={handleWorkername} />}
                    {step === 2 && association && userToken && <S2 association={association} token={userToken} next={handleMinerConnected} />}
                    {step === 3 && <S3 userAddress={userAddress} next={() => setReached(4)} />}
                    {step === 4 && association && <S4 address={userAddress} workername={association.workername} />}
                </div>
            </div>
        </StartBackground>
    );
}
