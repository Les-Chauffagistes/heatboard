import styles from "./landing.module.css";

export default function HowItWorks() {
    return (
        <section style={{ background: "var(--card-background-color)" }}>
            <div className={styles.container}>
                <h2>Comment ça marche</h2>

                <div className={`${styles.grid} ${styles.grid3}`} style={{ marginTop: 32 }}>
                    <p>1. Entrez votre adresse Bitcoin dans la recherche.</p>
                    <p>2. Consultez vos workers et leur hashrate en direct.</p>
                    <p>3. Optionnel : créez un compte pour gérer vos machines et votre adresse de paiement.</p>
                </div>
            </div>
        </section>
    );
}
