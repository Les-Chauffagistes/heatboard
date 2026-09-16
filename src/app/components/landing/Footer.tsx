import Image from "next/image";
import { BookOpenText, Globe, Users } from "lucide-react";
import { Footer as CmnFooter } from "@chauffagistes/cmn/ui";
import { COMMUNITY_POOL_ADDRESS } from "@/app/constants/columns";

const iconSize = 16;

export default function Footer() {
    return (
        <CmnFooter
            logoSrc="/brand-icon.png"
            logoAlt="Les Chauffagistes"
            brandName="Heatboard"
            brandHref="/"
            tagline="Dashboard public des pools de minage Bitcoin Chauffagistes"
            sections={[
                {
                    title: "Réseaux",
                    links: [
                        { label: "Discord", href: "https://discord.gg/5s9xfbZPBR", external: true, icon: <Image src="/Discord-Symbol-White.svg" width={iconSize} height={iconSize} alt="Discord" /> },
                        { label: "X", href: "https://x.com/Chauff_pool", external: true, icon: <Image src="/x.svg" width={iconSize} height={iconSize} alt="X" /> },
                        { label: "YouTube", href: "https://www.youtube.com/@chauffagistes", external: true, icon: <Image src="/youtube-app-white-icon.svg" width={iconSize} height={iconSize} alt="YouTube" /> },
                    ],
                },
                {
                    title: "Ressources",
                    links: [
                        { label: "GitHub", href: "https://github.com/Les-Chauffagistes", external: true, icon: <Image src="/GitHub_Invertocat_Light.svg" width={iconSize} height={iconSize} alt="GitHub" /> },
                        { label: "Wiki", href: "https://learn.chauffagistes-btc.fr", external: true, icon: <BookOpenText size={iconSize} /> },
                    ],
                },
                {
                    title: "Services",
                    links: [
                        { label: "Pool Communautaire", href: `/board/${COMMUNITY_POOL_ADDRESS}/workers`, icon: <Users size={iconSize} /> },
                        { label: "Site principal", href: "https://chauffagistes-btc.fr", external: true, icon: <Globe size={iconSize} /> },
                    ],
                },
            ]}
            bottomText="© 2024 — 2026 Les Chauffagistes"
            bottomSubtext="Bitcoin mining & chaleur utile"
        />
    );
}
