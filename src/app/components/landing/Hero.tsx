import Image from "next/image";
import NoisyBackground from "@/app/components/NoisyBackground";
import GoToCommunityPool from "@/app/components/GoToCommunityPool";
import GoToBEF from "@/app/components/GoToBEF";
import AddressSearch from "./AddressSearch";
import styles from "./landing.module.css";

export default function Hero() {
    return (
        <NoisyBackground
            backgroundColor="#141414"
            blob1Color="var(--orange)"
            blob2Color="var(--accent)"
            blob3Color="var(--accent)"
            noiseOpacity={35}
        >
            <section style={{ paddingTop: 110 }}>
                <div className={styles.container} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 24,
                }}>
                    <Image src="/brand-icon.png" alt="Heatboard" width={96} height={96} priority />

                    <div className={styles.fadeUp}>
                        <h1 style={{ color: "#f5f5f5" }}>
                            Votre minage Bitcoin,
                            <br />
                            <span style={{ color: "var(--orange)" }}>suivi en temps réel.</span>
                        </h1>

                        <p style={{ marginTop: 16, maxWidth: 560, color: "#c9c9c9" }}>
                            Heatboard est le dashboard public des pools de minage Chauffagistes :
                            hashrate de vos workers, statistiques de la pool et récompenses,
                            accessibles à partir de n&apos;importe quelle adresse Bitcoin — la vôtre
                            ou celle de la pool communautaire.
                        </p>
                    </div>

                    <div style={{ marginTop: 8, width: "100%", maxWidth: 420 }}>
                        <AddressSearch />
                    </div>

                    <p style={{ color: "#9a9a9a" }}>Ou</p>

                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                    }}>
                        <GoToCommunityPool />
                        {/*<GoToBEF />*/}
                    </div>
                </div>
            </section>
        </NoisyBackground>
    );
}
