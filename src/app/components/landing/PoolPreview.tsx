import Image from "next/image";
import styles from "./landing.module.css";

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

                <div className={styles.previewCard} style={{ width: "100%", maxWidth: 900, padding: 0, lineHeight: 0 }}>
                    <Image
                        src="/screenshots/pool-dashboard.png"
                        alt="Vue d'ensemble de la pool Heatboard : hashrate, répartition des mineurs et évolution"
                        width={1600}
                        height={620}
                        style={{ width: "100%", height: "auto", display: "block", borderRadius: "var(--radius)" }}
                    />
                </div>
            </div>
        </section>
    );
}
