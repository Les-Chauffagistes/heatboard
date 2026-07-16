"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import { logOut } from "@/lib/auth";
import "./desktopNavbar.css"


export function DesktopNavbar() {
    const path = usePathname();
    const { user } = useSession();
    return (
        <div id="desktop-navbar" style={{
            display: "flex",
            gap: 10,
            width: "100%",
            padding: 10,
            backgroundColor: "var(--desktop-navbar-background-color)",
            alignItems: "center"
        }}>
            <Link href="workers">
                <div className={path.endsWith('workers') ? "des-nav-active" : ""}>
                    Workers
                </div>
            </Link>
            <Link href="pool">
                <div className={path.endsWith('pool') ? "des-nav-active" : ""}>
                    Pool
                </div>
            </Link>
            <Link href="my">
                <div className={path.endsWith("my") ? "des-nav-active" : ""}>
                    Profil
                </div>
            </Link>

            {user && (
                <button style={{ marginLeft: "auto" }} className="tertiary" onClick={async () => {
                    await logOut();
                    globalThis.location.reload()
                }}>
                    <div>
                        Déconnexion
                    </div>
                </button>
            )}

        </div>
    )
}
