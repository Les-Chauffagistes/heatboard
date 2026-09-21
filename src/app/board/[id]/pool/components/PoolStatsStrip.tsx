import { LucideIcon } from "lucide-react";
import { IBM_Plex_Mono } from "next/font/google";
import "./poolStatsStrip.css";

// Archivo (texte/labels) + IBM Plex Mono (valeurs numériques techniques) : la
// paire retenue pour l'app. Remplace Jua ici plutôt que d'ajouter une 3e
// police — ces chiffres (hashrate, shares) sont exactement le contenu
// technique pour lequel le mono a été choisi.
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["600", "700"] });

type StatItem = { label: string; value: string };

export default function PoolStatsStrip({ hero, heroIcon: HeroIcon, secondaryGroups }: Readonly<{
    hero: StatItem;
    heroIcon: LucideIcon;
    // Un groupe = une famille de métriques (ex. les autres périodes de hashrate,
    // puis les shares) : un séparateur vertical s'affiche entre deux groupes,
    // jamais avant le premier (cf. .pool-stats-secondary-group + .pool-stats-secondary-group).
    secondaryGroups: StatItem[][];
}>) {
    return (
        <div className="pool-stats-strip">
            <div className="pool-stats-hero">
                <span className={`pool-stats-hero-value ${mono.className}`}>{hero.value}</span>
                <span className="pool-stats-hero-label">
                    <HeroIcon size={13} />
                    {hero.label}
                </span>
            </div>
            {secondaryGroups.map((group, i) => (
                <div key={i} className="pool-stats-secondary-group">
                    {group.map((item) => (
                        <div key={item.label} className="pool-stats-secondary-item">
                            <span className={`pool-stats-secondary-value ${mono.className}`}>{item.value}</span>
                            <span className="pool-stats-secondary-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
