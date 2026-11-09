import { patchUser } from "@/app/api";
import { FormEvent, useState } from "react"
import { isValidBtcAddress } from "@/server/payout/btcAddress";
import Step from "../components/Step";
import Help from "../components/Help";
import { useRouter } from "next/navigation";

export default function S3({ userAddress, next }: Readonly<{ userAddress: string, next: (address: string) => void }>) {
    const router = useRouter();
    const [address, setAddress] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    // L'invalidité n'est signalée qu'à la validation ou à la perte de focus, jamais pendant la saisie.
    const [checked, setChecked] = useState(false);

    const trimmed = address.trim();
    const valid = isValidBtcAddress(trimmed);
    const invalid = checked && !valid;

    async function submit(e: FormEvent) {
        e.preventDefault();
        setChecked(true);
        if (!valid || pending) return;
        setPending(true);
        setError(null);
        try {
            const res = await patchUser({ address: trimmed });
            if (res?.error) {
                setError(res.error === "Invalid data structure" ? "Adresse invalide." : res.error);
                return;
            }
            next(trimmed);
        } catch {
            setError("Impossible de joindre le serveur, réessayez.");
        } finally {
            setPending(false);
        }
    }

    let invalidMessage = "";
    if (invalid) invalidMessage = trimmed === "" ? "Saisissez une adresse." : "Adresse Bitcoin invalide.";
    const message = error ?? invalidMessage;

    return (
        <form className="step-form" onSubmit={submit}>
            <Step number={3} title="Adresse de paiement" />
            <p>Adresse Bitcoin sur laquelle recevoir vos paiements.</p>
            <Help summary="Conseil">
                Utilisez de préférence un hardware wallet dédié, conservé en lieu sûr.
            </Help>
            <div className="field">
                <label htmlFor="payout-address">Adresse Bitcoin</label>
                <input id="payout-address" type="text" autoComplete="off" spellCheck={false}
                    value={address} onChange={(e) => { setAddress(e.target.value); setError(null); setChecked(false); }}
                    onBlur={() => setChecked(trimmed !== "")}
                    aria-invalid={invalid || !!error} aria-describedby="payout-msg" />
                <p id="payout-msg" className="field-msg error" role="alert">{message}</p>
            </div>
            <div className="step-actions">
                <button type="button" className="secondary" disabled={pending}
                    onClick={() => router.push(`/board/${userAddress}/my`)}>Ajouter plus tard</button>
                <button type="submit" className="primary" disabled={pending}>Terminer</button>
            </div>
        </form>
    )
}
