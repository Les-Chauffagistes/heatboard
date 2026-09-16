import Image from "next/image";
import Link from "next/link";
import styles from "./landing.module.css";

export default function PoolPromoCard() {
    return (
        <section style={{ background: "var(--background)" }}>
            <div className={styles.container} style={{ textAlign: "center" }}>
                <p style={{ marginBottom: "0.1rem" }}>Ce n&apos;est pas ce que vous cherchiez ?</p>
                <p>Rendez-vous sur la page d&apos;accueil de la pool</p>

                <Link href="https://chauffagistes-btc.fr" style={{ display: "inline-block" }}>
                    <div style={{
                        borderTopLeftRadius: 50,
                        borderBottomLeftRadius: 50,
                        borderTopRightRadius: 30,
                        borderBottomRightRadius: 30,
                        width: "fit-content",
                        margin: "20px auto 0",
                        display: "flex",
                        alignItems: "center",
                        background: "linear-gradient(180deg, #eda042ff 0%, var(--orange) 100%)",
                        gap: 10,
                        paddingRight: 20,
                        textAlign: "left",
                    }}>
                        <Image src="/round-icon.png" alt="Les Chauffagistes" width={100} height={100} />
                        <div>
                            <h2 style={{ marginBottom: "0.2rem", color: "var(--background)", fontSize: "1.2rem" }}>
                                Présentation générale de la Pool
                            </h2>
                            <p style={{ color: "var(--background)" }}>Indépendant et Français</p>
                            <p style={{ color: "var(--background)" }}>Solo mining — Collaboratif — Pool</p>
                        </div>
                    </div>
                </Link>
            </div>
        </section>
    );
}
