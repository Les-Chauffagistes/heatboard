import { LinkedWorkers } from "../../../../../models/API Payloads/LinkedWorkers";
import Step from "../components/Step";



export default function S2({ association, token, next }: { association: LinkedWorkers | undefined, token: string, next: () => void }) {
    if (!association) return null;
    const ws = new WebSocket(`../api/${association.btc_address}/workernames/${association.workername}/ws?token=` + token);
    ws.onmessage = (event) => {
        console.log(event.data);
        const payload = JSON.parse(event.data);
        if (payload.ready) {
            next();
        }
    }

    ws.onopen = () => {
        console.log('waiting for pool payload');
    }

    ws.onclose = () => {
        console.log('disconnected');
    }

    ws.onerror = (event) => {
        console.log('error', event);
    }

    return (

        <div style={{
            height: "100%"
        }}>
            <Step number={2} title="Configurer un mineur" />
            <p>Vous avez réservé le workername {association.workername}.</p>
            <p>C&apos;est le moment de vous connecter à la pool ! Utilisez les informations suivantes sur votre mineur pour l&apos;associer à votre compte Chauffagiste.</p>
            <h3 style={{ marginTop: 20 }}>URL stratum</h3>
            <p>stratum+tcp://chauffagistes-pool.fr:3333</p>

            <h3 style={{ marginTop: 20 }}>User</h3>
            <p style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                maxWidth: "100%"
            }}>{association.btc_address}.{association.workername}</p>


            <h3 style={{ marginTop: 20 }}>Password</h3>
            <p>{association.code}</p>


            <div style={{ position: "absolute", bottom: 0, width: "100%", left: 0 }}>
                <p style={{
                    textAlign: "center",
                }}>Lorsque votre premier mineur sera connecté avec ces paramètres, vous pourrez automatiquement passer à la dernière étape.</p>
            </div>
        </div>


    );
}