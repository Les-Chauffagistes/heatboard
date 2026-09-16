import Image from "next/image";
import styles from "./landing.module.css";

export default function WorkersPreview() {
    return (
        <section style={{ background: "var(--background-alt)" }}>
            <div className={styles.container} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
            }}>
                <div style={{ maxWidth: 480, textAlign: "center" }}>
                    <h2>Vos workers, d&apos;un coup d&apos;œil</h2>
                    <p style={{ marginTop: 12, color: "var(--secondary-white-text-color)" }}>
                        Recherchez, triez et exportez la liste de vos machines et de leur
                        hashrate en quelques secondes.
                    </p>
                </div>

                <div className={styles.previewCard} style={{ width: "100%", maxWidth: 900, padding: 0, lineHeight: 0 }}>
                    <Image
                        src="/screenshots/workers-table.png"
                        alt="Tableau des workers Heatboard avec hashrate, shares et récompenses estimées"
                        width={1600}
                        height={620}
                        style={{ width: "100%", height: "auto", display: "block", borderRadius: "var(--radius)" }}
                    />
                </div>
            </div>
        </section>
    );
}
