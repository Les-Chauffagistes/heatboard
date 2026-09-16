import { Cpu, Users } from "lucide-react";
import ScreenshotFrame from "./ScreenshotFrame";
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

                <ScreenshotFrame
                    srcLight="/screenshots/workers-light.png"
                    srcDark="/screenshots/workers-dark.png"
                    alt="Tableau des workers Heatboard avec hashrate, shares et récompenses estimées"
                    width={1600}
                    height={620}
                    address="heatboard.app/board/bc1q…/workers"
                    tilt="left"
                    chips={[
                        { Icon: Cpu, value: "3.2 PH/s", label: "hashrate cumulé", position: "topLeft" },
                        { Icon: Users, value: "6", label: "workers actifs", position: "bottomRight" },
                    ]}
                />
            </div>
        </section>
    );
}
