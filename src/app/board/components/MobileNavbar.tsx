"use client";

import { useEffect, useRef } from "react";
import { Computer, Globe, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMobileNavHidden } from "@/app/hooks/useMobileNavVisibility";
import "./mobileNavbar.css"



export default function MobileNavbar() {
    const path = usePathname();
    const hidden = useMobileNavHidden();
    const ref = useRef<HTMLDivElement>(null);

    // Publie la hauteur réelle de la navbar dans une variable CSS pour que le
    // contenu scrollable réserve l'espace correspondant (la navbar est en overlay
    // absolu au-dessus de la liste, elle ne prend pas de place dans le flux flex).
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const publishHeight = () =>
            document.documentElement.style.setProperty("--mobile-navbar-height", `${el.offsetHeight}px`);
        publishHeight();
        const observer = new ResizeObserver(publishHeight);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} id="mobile-navbar" style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
            backgroundColor: "var(--mobile-navbar-background-color)",
            paddingTop: 10,
            paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            transform: hidden ? "translateY(100%)" : "translateY(0)",
            transition: "transform 0.25s ease",
            willChange: "transform"
        }}>
            <Link href="workers">
                <div className={path.endsWith('workers') ? "mob-nav-active" : ""}>
                    <Computer size={18} />
                    Workers
                </div>
            </Link>
            <Link href="pool">
                <div  className={path.endsWith('pool') ? "mob-nav-active" : ""}>
                    <Globe size={18}/>
                    Pool
                </div>
            </Link>
            <Link href="my">
                <div className={path.endsWith("my") ? "mob-nav-active" : ""}>
                    <User size={18}/>
                    Profil
                </div>
            </Link>
        </div>
    )
}