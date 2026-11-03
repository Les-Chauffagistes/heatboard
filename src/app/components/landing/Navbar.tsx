import { Navbar as CmnNavbar } from "@chauffagistes/cmn/ui";

export default function Navbar() {
    return (
        <CmnNavbar
            logoSrc="/brand-icon.png"
            logoAlt="Les Chauffagistes"
            links={[
                { label: "Site", href: "https://chauffagistes-btc.fr", external: true },
            ]}
        />
    );
}
