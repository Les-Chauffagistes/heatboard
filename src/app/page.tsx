import type { Metadata } from "next";
import ThemeBody from "./ThemeBody";
import Navbar from "./components/landing/Navbar";
import Footer from "./components/landing/Footer";
import Hero from "./components/landing/Hero";
import ComponentShowcase from "./components/landing/ComponentShowcase";
import FeaturesGrid from "./components/landing/FeaturesGrid";
import WorkersPreview from "./components/landing/WorkersPreview";
import PoolPreview from "./components/landing/PoolPreview";
import HowItWorks from "./components/landing/HowItWorks";
import PoolPromoCard from "./components/landing/PoolPromoCard";
import styles from "./components/landing/landing.module.css";

export const metadata: Metadata = {
  // Next.js n'applique pas le title.template du layout racine à une page qui
  // est son enfant direct (le calcul de titleTemplates saute les 2 derniers
  // segments de la chaîne layout/page) : on écrit donc le titre complet ici.
  title: "Accueil | Heatboard",
  description:
    "Consultez les statistiques de n'importe quelle pool de minage Chauffagistes : hashrate des workers en temps réel, vue d'ensemble de la pool et récompenses estimées.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <ThemeBody className={styles.landing}>
      <Navbar />
      <main>
        <Hero />
        <FeaturesGrid />
        <ComponentShowcase />
        <WorkersPreview />
        <PoolPreview />
        <HowItWorks />
        <PoolPromoCard />
      </main>
      <Footer />
    </ThemeBody>
  );
}
