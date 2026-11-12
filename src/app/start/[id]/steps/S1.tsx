import { workernameAvailable } from "@/app/api";
import { FormEvent, useEffect, useState } from "react";
import Step from "../components/Step";
import Help from "../components/Help";

/**
 * Choisir un workername
 */
export default function S1({ userAddress, next }: Readonly<{ userAddress: string, next: (workername: string) => Promise<string | undefined> }>) {
    const [value, setValue] = useState("");
    const [available, setAvailable] = useState<boolean | null>(null);
    const [pending, setPending] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const name = value.trim();

    useEffect(() => {
        setAvailable(null);
        if (!name) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            void workernameAvailable(userAddress, name).then((res) => {
                if (!cancelled) setAvailable(res);
            });
        }, 500);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [name, userAddress]);

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (!name || !available || pending) return;
        setPending(true);
        setSubmitError(null);
        try {
            const res = await next(name);
            if (res) {
                setSubmitError(res === "Already exists" ? "Ce workername n'est plus disponible." : "Erreur inattendue, réessayez.");
            }
        } catch {
            setSubmitError("Impossible de joindre le serveur, réessayez.");
        } finally {
            setPending(false);
        }
    }

    let message = "";
    let tone = "";
    if (submitError) {
        message = submitError;
        tone = "error";
    } else if (name && available === null) {
        message = "Vérification…";
    } else if (available !== null) {
        message = available ? "Ce workername est disponible." : "Ce workername n'est pas disponible.";
        tone = available ? "ok" : "error";
    }

    return (
        <form className="step-form" onSubmit={submit}>
            <Step number={1} title="Réserver un workername" />
            <p>Choisissez le nom que vos mineurs utiliseront pour se connecter à la pool.</p>
            <Help>
                Ce nom doit être unique. Vous pouvez reprendre votre pseudo s&apos;il est disponible. Les appareils qui l&apos;utilisent sont définitivement liés à votre compte et à l&apos;adresse de paiement que vous définirez ensuite.
            </Help>
            <div className="field">
                <label htmlFor="workername">Workername</label>
                <input id="workername" type="text" autoComplete="off" spellCheck={false}
                    value={value} onChange={(e) => setValue(e.target.value)}
                    aria-describedby="workername-msg" />
                <output id="workername-msg" className={`field-msg ${tone}`}>{message}</output>
            </div>
            <button type="submit" className="primary" disabled={!name || !available || pending}>Continuer</button>
        </form>
    )
}
