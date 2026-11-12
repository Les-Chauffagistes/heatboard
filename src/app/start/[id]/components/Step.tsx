export default function Step({ number, total = 3, title }: Readonly<{ number: number, total?: number, title: string }>) {
    return (
        <header className="card-header">
            <span className="card-kicker">Étape {number} sur {total}</span>
            <h2 className="card-name">{title}</h2>
        </header>
    )
}
