import { Cpu } from "lucide-react";
import styles from "./landing.module.css";

const ROWS = [
    { name: "worker-01", hashrate: 92 },
    { name: "worker-02", hashrate: 78 },
    { name: "worker-03", hashrate: 61 },
    { name: "worker-04", hashrate: 45 },
];

export default function WorkersPreview() {
    return (
        <section style={{ background: "var(--card-background-color)" }}>
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

                <div className={styles.previewCard} style={{ width: "100%", maxWidth: 640, background: "var(--background)" }}>
                    {ROWS.map((row, i) => (
                        <div key={row.name} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 0",
                            borderBottom: i < ROWS.length - 1 ? "1px solid var(--card-outline-color)" : "none",
                        }}>
                            <Cpu size={18} style={{ flexShrink: 0, color: "var(--orange)" }} />
                            <span style={{ minWidth: 90, fontSize: "0.85rem" }}>{row.name}</span>
                            <div style={{
                                flex: 1,
                                height: 8,
                                borderRadius: 999,
                                background: "var(--input-background-color)",
                                overflow: "hidden",
                            }}>
                                <div style={{ width: `${row.hashrate}%`, height: "100%", background: "var(--orange)" }} />
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "var(--secondary-white-text-color)" }}>
                                {row.hashrate} TH/s
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
