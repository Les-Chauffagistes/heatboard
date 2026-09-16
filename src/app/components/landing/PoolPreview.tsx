import styles from "./landing.module.css";

const CHART_POINTS = "0,40 20,32 40,35 60,20 80,24 100,10 120,16 140,6";

export default function PoolPreview() {
    return (
        <section style={{ background: "var(--background)" }}>
            <div className={styles.container} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
            }}>
                <div style={{ maxWidth: 480, textAlign: "center" }}>
                    <h2>Une vue d&apos;ensemble de la pool</h2>
                    <p style={{ marginTop: 12, color: "var(--secondary-white-text-color)" }}>
                        Évolution du hashrate global et répartition des mineurs, pour
                        n&apos;importe quelle pool Chauffagistes.
                    </p>
                </div>

                <div style={{
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    width: "100%",
                }}>
                    <div className={styles.previewCard} style={{ flex: "1 1 320px", maxWidth: 380 }}>
                        <p style={{ fontSize: "0.8rem", color: "var(--secondary-white-text-color)", marginBottom: 12 }}>
                            Hashrate — évolution
                        </p>
                        <svg viewBox="0 0 140 50" width="100%" height="90" preserveAspectRatio="none">
                            <polyline points={CHART_POINTS} fill="none" stroke="var(--orange)" strokeWidth="2" />
                        </svg>
                    </div>

                    <div className={styles.previewCard} style={{
                        flex: "1 1 320px",
                        maxWidth: 380,
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                    }}>
                        <svg viewBox="0 0 42 42" width={100} height={100} style={{ flexShrink: 0 }}>
                            <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--card-outline-color)" strokeWidth="6" />
                            <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--orange)" strokeWidth="6"
                                strokeDasharray="55 45" transform="rotate(-90 21 21)" />
                            <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--accent)" strokeWidth="6"
                                strokeDasharray="30 70" strokeDashoffset="-55" transform="rotate(-90 21 21)" />
                        </svg>
                        <p style={{ fontSize: "0.8rem", color: "var(--secondary-white-text-color)" }}>
                            Répartition du hashrate par mineur
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
