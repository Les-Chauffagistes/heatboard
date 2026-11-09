"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavbarMenu from "./NavbarMenu";
import "./desktopNavbar.css"

const TABS = [
    { href: "workers", label: "Workers" },
    { href: "pool", label: "Pool" },
    { href: "my", label: "Profil" },
];

type Indicator = { left: number; width: number };

export function DesktopNavbar() {
    const path = usePathname();
    const tabsRef = useRef<HTMLDivElement>(null);
    const [indicator, setIndicator] = useState<Indicator | null>(null);

    // Mesure l'onglet actif pour y caler la pastille ; la transition CSS fait le glissement.
    useLayoutEffect(() => {
        const container = tabsRef.current;
        if (!container) return;
        const measure = () => {
            const active = container.querySelector<HTMLElement>(".des-nav-active");
            setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
        };
        measure();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(measure);
        observer.observe(container);
        return () => observer.disconnect();
    }, [path]);

    return (
        <div id="desktop-navbar" style={{
            gap: 10,
            width: "100%",
            padding: 10,
            backgroundColor: "var(--desktop-navbar-background-color)",
            alignItems: "center"
        }}>
            <div ref={tabsRef} className="des-nav-tabs">
                <span
                    className="des-nav-indicator"
                    aria-hidden="true"
                    style={indicator
                        ? { transform: `translateX(${indicator.left}px)`, width: indicator.width, opacity: 1 }
                        : undefined}
                />
                {TABS.map((tab) => (
                    <Link key={tab.href} href={tab.href}>
                        <div className={path.endsWith(tab.href) ? "des-nav-active" : ""}>
                            {tab.label}
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{ marginLeft: "auto" }}>
                <NavbarMenu variant="inline" />
            </div>
        </div>
    )
}
