import CopyField from "../components/CopyField";

export default function S4({ address, workername }: Readonly<{ address: string, workername: string }>) {
    return (
        <div className="step-form">
            <header className="card-header">
                <span className="card-kicker success">✓ Terminé</span>
                <h2 className="card-name">Tout est prêt</h2>
            </header>
            <p>Connectez vos mineurs avec ce user :</p>
            <CopyField label="User" value={`${address}.${workername}`} />
            <p>Pseudo, adresse de paiement et statistiques sont accessibles depuis le <a href={`/board/${address}/my`}>dashboard</a>.</p>
        </div>
    )
}
