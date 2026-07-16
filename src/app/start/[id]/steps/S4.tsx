

export default function S4({ address, workername }: { address: string, workername: string }) {
    return (
        <div>
            <h1 style={{ marginBottom: 30 }}>C&apos;est terminé !</h1>
            <p>Tout est prêt, connectez vos mineurs chez Les Chauffagistes en utilisant votre workername</p>
            <p>Vous pouvez modifier votre pseudo, votre adresse de réception et consulter vos statistiques depuis le <a href={`/board/${address}/my`}>dahboard</a></p>
            <h2 style={{ marginTop: 20 }}>User</h2>
            <p style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                maxWidth: "100%"
            }}>{address}.{workername}</p>
        </div>
    )
}