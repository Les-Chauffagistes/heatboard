import { getLinkedWorkers } from "@/app/api";
import { useEffect, useRef, useState } from "react";
import { LinkedWorkers } from "../../../../../models/API Payloads/LinkedWorkers";
import Step from "../components/Step";
import Help from "../components/Help";
import CopyField from "../components/CopyField";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

export default function S2({ association, token, next }: Readonly<{ association: LinkedWorkers, token: string, next: () => void }>) {
    const nextRef = useRef(next);
    useEffect(() => { nextRef.current = next; });

    const { btc_address, workername } = association;

    const [connected, setConnected] = useState(false);
    const [minerFound, setMinerFound] = useState(false);

    useEffect(() => {
        let ws: WebSocket | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let attempt = 0;
        let stopped = false;

        function connect() {
            ws = new WebSocket(`../api/${btc_address}/workernames/${workername}/ws?token=` + token);
            ws.onopen = () => {
                attempt = 0;
                setConnected(true);
                // Un "ready" envoyé pendant une coupure est perdu : on revérifie l'état à chaque (re)connexion.
                getLinkedWorkers(btc_address).then((res) => {
                    if (!stopped && res?.[0]?.status === "done") {
                        stopped = true;
                        setMinerFound(true);
                        nextRef.current();
                    }
                }).catch(() => {});
            };
            ws.onmessage = (event) => {
                try {
                    if (JSON.parse(event.data).ready) {
                        stopped = true;
                        setMinerFound(true);
                        nextRef.current();
                    }
                } catch {
                    // message non JSON : ignoré
                }
            };
            ws.onclose = () => {
                setConnected(false);
                if (stopped) return;
                // Backoff exponentiel plafonné, avec jitter pour éviter les reconnexions simultanées.
                const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt) * (0.5 + Math.random() / 2);
                attempt++;
                timer = setTimeout(connect, delay);
            };
        }

        connect();
        return () => {
            stopped = true;
            clearTimeout(timer);
            ws?.close();
        };
    }, [btc_address, workername, token]);

    let status = "Reconnexion au serveur…";
    if (minerFound) status = "Mineur connecté !";
    else if (connected) status = "En attente de votre premier mineur…";

    return (
        <div className="step-form">
            <Step number={2} title="Configurer votre mineur" />
            <p>Renseignez ces valeurs dans votre mineur pour l&apos;associer à <strong>{workername}</strong>.</p>

            <CopyField label="URL stratum" value="stratum+tcp://chauffagistes-pool.fr:3333" />
            <CopyField label="User" value={`${btc_address}.${workername}`} />
            <CopyField label="Password" value={String(association.code ?? "")} />

            <output className="waiting">
                <span className="pulse" aria-hidden="true" />
                {status}
            </output>
            <Help summary="Et ensuite ?">
                Dès qu&apos;un mineur se connecte avec ces paramètres, vous passez automatiquement à l&apos;étape suivante.
            </Help>
        </div>
    );
}
