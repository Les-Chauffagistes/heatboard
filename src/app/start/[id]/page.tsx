"use client";

import { getLinkedWorkers, getUserToken, registerWorkername } from "@/app/api";
import { useSession } from "@/app/hooks/useSession";
import { usePathname } from "next/navigation";
import { CSSProperties, useEffect, useState } from "react";
import { LinkedWorkers } from "../../../../models/API Payloads/LinkedWorkers";
import S1 from "./steps/S1";
import S2 from "./steps/S2";
import S3 from "./steps/S3";
import S4 from "./steps/S4";

import "./styles.css";
import NoisyBackground from "@/app/components/NoisyBackground";
import { config } from "@/lib/config";



export default function StatPage() {
    const path = usePathname();

    const { user, isLoading } = useSession();
    const [userToken, setUserToken] = useState<string | null>(null);

    const [linkedWorkers, setLinkedWorkers] = useState<LinkedWorkers[] | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const userAddress = path.split("/")[2];

    useEffect(() => {
        if (!user) { setCurrentStep(3); return; }
        if (!userToken) { setCurrentStep(3); return; }
        if (!linkedWorkers || linkedWorkers.length === 0) { setCurrentStep(3); return; }
        if (linkedWorkers[0].status !== "done") { setCurrentStep(4); return; }
        if (!user.address) { setCurrentStep(5); return; }
        setCurrentStep(6);
    }, [user, userToken, linkedWorkers]);

    useEffect(() => {
        if (user) {
            getLinkedWorkers(userAddress).then((res) => setLinkedWorkers(res));
            getUserToken().then((res) => setUserToken(res));
        } else {
            setLinkedWorkers([]);
            setUserToken(null);
        }
    }, [user, userAddress]);

    if (isLoading) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>Préchauffage...</div>;
    }

    if (!user) {
        window.location.href = `${config.AUTH_URL}/login?redirect=${config.BASE_URL}${path}`;
        return null;
    }

    const stack = [];

    if (currentStep >= 3) stack.push(<S1 key={3} userAddress={userAddress} next={handleS3next} />);
    if (currentStep >= 4) stack.push(<S2 key={4} association={linkedWorkers?.[0]} token={userToken!} next={() => setCurrentStep(5)} />);
    if (currentStep >= 5) stack.push(<S3 key={5} next={handleS5next} />);
    if (linkedWorkers?.[0]) {
        if (currentStep >= 6) stack.push(<S4 key={6} address={userAddress} workername={linkedWorkers[0].workername} />);
    }

    async function handleS3next(workername: string): Promise<string | undefined> {
        const result = await registerWorkername(userAddress, workername);
        if ("error" in result) {
            return result.error;
        }
        const fresh = await getLinkedWorkers(userAddress);
        setLinkedWorkers(fresh);
        setCurrentStep(4);
    }

    function handleS5next() {
        setCurrentStep(6);
    }

    const stackLen = stack.length;
    const maxTranslate = 30;
    const maxScaleLoss = 0.5;
    const translateFactor = 4;
    const zoomFactor = 5;

    return (
        <NoisyBackground grainIntensity={45} blob1Color="rgba(190, 126, 37, 1)" blob2Color="rgba(207, 110, 61, 1)" blob3Color="rgba(189, 112, 18, 1)" backgroundColor="rgba(52, 37, 26, 1)"
            style={{
                width: "100%",
                height: "100dvh",
                overflow: "auto",
                flexDirection: "column",
                display: "flex",
                backgroundColor: "var(--background)"
            }}>
            <h1 id="start-title">Enregistrer un mineur chez Les Chauffagistes</h1>

            <p id="description" style={{ margin: "20px 0 40px", textAlign: "center" }}>
                Pour nous permettre de confirmer que le mineur que vous allez connecter vous appartient, vous allez suivre une procédure de connexion.
            </p>

            <div id="card-container" style={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                pointerEvents: "none"
            }}>
                {stack.map((card, i) => {
                    const depth = stackLen - i - 1;
                    const f = Math.log1p(depth) / Math.log1p(depth + translateFactor);
                    const zoomF = Math.log1p(depth) / Math.log1p(depth + zoomFactor);
                    const translateY = -maxTranslate * f;
                    const scale = 1 - maxScaleLoss * zoomF;
                    const fade = Math.min(depth * 0.3, 0.8);

                    const style = {
                        "--depth-fade": fade,
                        position: "absolute",
                        top: 20,
                        width: Math.min(820, window.innerWidth - 64),
                        maxWidth: "95%",
                        transformOrigin: "top center",
                        transition: "transform 250ms cubic-bezier(.2,.9,.2,1)",
                        pointerEvents: depth === 0 ? "auto" : "none",
                        transform: `translateY(${translateY}px) scale(${scale})`,
                        border: depth === 0 ? "1px solid var(--card-outline-color)" : "",
                        zIndex: i + 50,
                    } as CSSProperties;

                    const isTop = i === stackLen - 1;

                    return (
                        <div
                            key={i}
                            className={`card ${isTop ? "is-top-enter" : "is-behind"}`}
                            style={style}
                        >
                            {card}
                        </div>
                    );
                })}
            </div>
        </NoisyBackground>
    );
}
