import { PieChart, TrendingUp } from "lucide-react";
import ScreenshotFrame from "./ScreenshotFrame";
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

                <ScreenshotFrame
                    srcLight="/screenshots/pool-light.png"
                    srcDark="/screenshots/pool-dark.png"
                    alt="Vue d'ensemble de la pool Heatboard : hashrate, répartition des mineurs et évolution"
                    width={1600}
                    height={620}
                    address="heatboard.app/board/bc1q…/pool"
                    tilt="right"
                    chips={[
                        { Icon: TrendingUp, value: "+12%", label: "hashrate sur 7j", position: "topRight" },
                        { Icon: PieChart, value: "128", label: "mineurs connectés", position: "bottomLeft" },
                    ]}
                />
            </div>
        </section>
    );
}
