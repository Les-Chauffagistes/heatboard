import { Bitcoin, Download, LineChart, Smartphone, Table, UserCog } from "lucide-react";
import { ComponentType } from "react";
import styles from "./landing.module.css";

type Item = {
    label: string;
    text: string;
    Icon: ComponentType;
};

const ITEMS: Item[] = [
    {
        label: "Tous vos workers, en direct",
        text: "Hashrate 1m/5m/1h/1d/7d, shares et best share pour chaque machine connectée.",
        Icon: Table,
    },
    {
        label: "Évolution & répartition de la pool",
        text: "Graphique d'évolution du hashrate et répartition des mineurs par part de la pool.",
        Icon: LineChart,
    },
    {
        label: "Récompenses estimées",
        text: "Estimation de récompense BTC par worker sur la pool communautaire.",
        Icon: Bitcoin,
    },
    {
        label: "Export CSV",
        text: "Exportez vos statistiques de workers pour les analyser où vous voulez.",
        Icon: Download,
    },
    {
        label: "Pensé pour le mobile",
        text: "Une vue adaptée pour surveiller vos machines depuis votre téléphone.",
        Icon: Smartphone,
    },
    {
        label: "Espace personnel",
        text: "Liez vos workers à un compte, gérez votre adresse de paiement et invitez vos proches.",
        Icon: UserCog,
    },
];

export default function FeaturesGrid() {
    return (
        <section style={{ background: "var(--background)" }}>
            <div className={styles.container}>
                <h2>Tout ce dont vous avez besoin pour suivre votre minage</h2>
                <p style={{ marginTop: 12, maxWidth: 560, color: "var(--secondary-white-text-color)" }}>
                    Heatboard fonctionne avec n&apos;importe quelle pool
                    Chauffagistes, pas seulement la pool communautaire.
                </p>

                <div className={`${styles.grid} ${styles.grid3}`} style={{ marginTop: 32 }}>
                    {ITEMS.map(({ label, text, Icon }) => (
                        <div key={label} className={styles.featureCard}>
                            <Icon />
                            <div>
                                <h3 style={{ fontSize: "1rem" }}>{label}</h3>
                                <p style={{ marginTop: 6, fontSize: "0.9rem" }}>{text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
