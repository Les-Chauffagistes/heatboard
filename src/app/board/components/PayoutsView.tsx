"use client";

import { useState } from "react";
import type { Payment, PaymentStatus, Payouts, RequiredAction } from "@/../models/API Payloads/Payouts";
import { confirmPayoutAddress } from "@/app/hooks/usePayouts";
import "./payouts.css";
import Link from "next/link";
import { Box } from "lucide-react";
import { COMMUNITY_POOL_ADDRESS } from "@/app/constants/columns";

const STATUS_LABEL: Record<PaymentStatus, string> = {
    waiting: "En attente de votre adresse",
    pending: "En cours de préparation",
    sent: "Envoyé",
    cancelled: "Annulé",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (iso: string) => dateFormat.format(new Date(iso));
const formatBtc = (satoshi: number) => `${(satoshi / 1e8).toFixed(8)} BTC`;

function AddressForm({ action, address, onDone }: Readonly<{ action: RequiredAction; address: string | null; onDone: () => void }>) {
    const [value, setValue] = useState("");
    const [changing, setChanging] = useState(action === "address_missing");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit(newAddress?: string) {
        setBusy(true);
        setError(null);
        const result = await confirmPayoutAddress(newAddress);
        setBusy(false);
        if (result.ok) onDone();
        else setError(result.error);
    }

    return (
        <div className="payouts-alert" role="alert">
            {action === "address_missing" ? (
                <p>Un block a été trouvé ! Renseignez votre adresse Bitcoin pour recevoir votre récompense.</p>
            ) : (
                <p>
                    Un block a été trouvé ! Votre adresse de paiement n&apos;a pas été confirmée depuis plus d&apos;un mois.
                    Confirmez que vous la possédez toujours et que vous souhaitez être payé dessus :
                </p>
            )}
            {action === "address_confirmation_required" && address && <span className="payouts-address">{address}</span>}
            {action === "address_confirmation_required" && !changing && (
                <div className="payouts-form">
                    <button type="button" className="primary" disabled={busy} onClick={() => submit()}>
                        Je confirme cette adresse
                    </button>
                    <button type="button" disabled={busy} onClick={() => setChanging(true)}>
                        Utiliser une autre adresse
                    </button>
                </div>
            )}
            {changing && (
                <form className="payouts-form" onSubmit={(e) => { e.preventDefault(); void submit(value.trim()); }}>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="bc1…"
                        aria-label="Adresse Bitcoin de paiement"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <button type="submit" className="primary" disabled={busy || value.trim() === ""}>
                        Enregistrer et confirmer
                    </button>
                </form>
            )}
            {error && <span className="payouts-error">{error}</span>}
        </div>
    );
}

const formatPart = (part: string) =>
    `${(Number(part) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

function PaymentCard({ payment }: Readonly<{ payment: Payment }>) {
    return (
        <li className="payouts-payment">
            <header className="payouts-payment-head">
                <div className="payouts-payment-block">
                    <h2 className="payouts-block">Block {payment.block.toLocaleString("fr-FR")}</h2>
                    <span className="payouts-meta">Miné le {formatDate(payment.blockRef.minedAt)}</span>
                </div>
                <span className={`payouts-badge payouts-badge-${payment.status}`}>{STATUS_LABEL[payment.status]}</span>
            </header>

            <div className="payouts-payment-body">
                <div className="payouts-summary">
                    <div className="payouts-field">
                        <span className="payouts-label">Votre récompense</span>
                        <span className="payouts-amount">{formatBtc(payment.amountSatoshi)}</span>
                    </div>
                    <div className="payouts-field">
                        <span className="payouts-label">Worker</span>
                        <span className="payouts-value">{payment.workername}</span>
                    </div>
                    <div className="payouts-field">
                        <span className="payouts-label">Part du travail</span>
                        <span className="payouts-value">{formatPart(payment.part)}</span>
                    </div>
                    <div className="payouts-field">
                        <span className="payouts-label">Adresse de paiement figée</span>
                        {payment.btc_address
                            ? <span className="payouts-address">{payment.btc_address}</span>
                            : <span className="payouts-value payouts-muted">Pas encore figée</span>}
                    </div>
                </div>

                <div className="payouts-history">
                    <span className="payouts-label">Historique</span>
                    <ol className="payouts-log" aria-label="Historique du paiement">
                        {payment.updates.map((u) => (
                            <li key={u.id} className={`payouts-log-item payouts-log-${u.toStatus}`}>
                                <span className="payouts-log-date">{formatDate(u.created_at)}</span>
                                <span className="payouts-log-status">{STATUS_LABEL[u.toStatus]}</span>
                                {u.note && <span className="payouts-log-note">{u.note}</span>}
                                {u.txid && (
                                    <a href={`https://mempool.space/tx/${u.txid}`} target="_blank" rel="noopener noreferrer">
                                        Voir la transaction
                                    </a>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </li>
    );
}

const EMPTY_STEPS: { title: string; description: React.ReactNode }[] = [
    {
        title: "Liez votre worker à votre compte",
        description: (
            <>
                Seuls les workers liés à un compte peuvent être payés. Faites-le depuis votre{" "}
                <Link href={`/board/${COMMUNITY_POOL_ADDRESS}/my`}>profil</Link>.
            </>
        ),
    },
    {
        title: "Renseignez votre adresse Bitcoin",
        description: "Elle vous est demandée quand un block est trouvé, puis à reconfirmer tous les 30 jours.",
    },
    {
        title: "Suivez le paiement ici",
        description: "Le statut et l'historique de chaque récompense s'affichent sur cette page.",
    },
];

function EmptyState() {
    return (
        <div className="payouts-empty-state">
            <Box className="payouts-empty-icon" size={72} strokeWidth={1.25} aria-hidden="true" />
            <div className="payouts-empty-text">
                <h1 className="payouts-empty-title">Aucune récompense pour le moment</h1>
                <p className="payouts-empty">Vos paiements apparaîtront ici dès que la pool communautaire trouvera un block.</p>
            </div>
            <ol className="payouts-steps" aria-label="Comment être payé">
                {EMPTY_STEPS.map((step) => (
                    <li key={step.title} className="payouts-step">
                        <span className="payouts-step-title">{step.title}</span>
                        <span className="payouts-step-description">{step.description}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export default function PayoutsView({ payouts, address, onChanged }: Readonly<{
    payouts: Payouts | undefined;
    address: string | null;
    onChanged: () => void;
}>) {
    return (
        <section className="payouts-page" aria-label="Récompenses de blocks">
            {payouts?.requiredAction && (
                <AddressForm action={payouts.requiredAction} address={address} onDone={onChanged} />
            )}
            {payouts?.payments.length === 0 && <EmptyState />}
            {payouts && payouts.payments.length > 0 && (
                <ul className="payouts-list">
                    {payouts.payments.map((p) => <PaymentCard key={p.id} payment={p} />)}
                </ul>
            )}
        </section>
    );
}
