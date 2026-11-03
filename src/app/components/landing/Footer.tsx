import { BookOpenText, Globe, Users } from "lucide-react";
import { Footer as CmnFooter } from "@chauffagistes/cmn/ui";
import { COMMUNITY_POOL_ADDRESS } from "@/app/constants/columns";
import { DiscordIcon, GithubIcon, XIcon, YoutubeIcon } from "./SocialIcons";

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
                        { label: "Discord", href: "https://discord.gg/5s9xfbZPBR", external: true, icon: <DiscordIcon size={iconSize} /> },
                        { label: "X", href: "https://x.com/Chauff_pool", external: true, icon: <XIcon size={iconSize} /> },
                        { label: "YouTube", href: "https://www.youtube.com/@chauffagistes", external: true, icon: <YoutubeIcon size={iconSize} /> },
                    ],
                },
                {
                    title: "Ressources",
                    links: [
                        { label: "GitHub", href: "https://github.com/Les-Chauffagistes", external: true, icon: <GithubIcon size={iconSize} /> },
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
