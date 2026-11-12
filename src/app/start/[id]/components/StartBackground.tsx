"use client";

import { CSSProperties, ReactNode, useEffect, useState } from "react";

const MAX_STEP = 4;
const EMBER_COUNT = 28;
// Les braises survivent au flash pour s'estomper après le changement de carte.
const EMBERS_LIFETIME_MS = 3000;

// Valeurs déterministes (pas de Math.random : rendu identique serveur/client).
const EMBERS = Array.from({ length: EMBER_COUNT }, (_, i) => ({
    id: `ember-${i}`,
    style: {
        left: `${10 + ((i * 37) % 80)}%`,
        width: 3 + ((i * 7) % 4),
        height: 3 + ((i * 7) % 4),
        animationDelay: `${(i * 53) % 500}ms`,
        animationDuration: `${1600 + ((i * 71) % 900)}ms`,
        "--drift": `${((i * 29) % 80) - 40}px`,
        "--rise": `${40 + ((i * 13) % 40)}vh`,
    } as CSSProperties,
}));

/**
 * Fond de /start : deux lueurs qui montent et s'intensifient à chaque étape
 * (le feu se rallume), plus un grain SVG statique. `flash` déclenche un bref
 * éclat de chaleur et des braises (mineur connecté).
 */
export default function StartBackground({ step, flash = false, children }: Readonly<{ step: number, flash?: boolean, children: ReactNode }>) {
    const heat = (Math.min(Math.max(step, 1), MAX_STEP) - 1) / (MAX_STEP - 1); // 0 → 1
    const [burst, setBurst] = useState(0); // change à chaque flash pour relancer les animations
    const [embers, setEmbers] = useState(false);

    useEffect(() => {
        if (!flash) return;
        setBurst((b) => b + 1);
        setEmbers(true);
    }, [flash]);

    useEffect(() => {
        if (!embers) return;
        const timer = setTimeout(() => setEmbers(false), EMBERS_LIFETIME_MS);
        return () => clearTimeout(timer);
    }, [embers, burst]);

    const glow = (base: number): CSSProperties => ({
        opacity: base + heat * (1 - base),
        transform: `translateY(${(1 - heat) * 35}%)`,
    });

    return (
        <div className={`start-bg${flash ? " flashing" : ""}`}>
            <div className="start-bg-layers" aria-hidden="true">
                <div className="glow glow-a" style={glow(0.35)}><div /></div>
                <div className="glow glow-b" style={glow(0.2)}><div /></div>
                <div className="flash-layer" />
                {embers && (
                    <div className="embers" key={burst}>
                        {EMBERS.map(({ id, style }) => <span key={id} className="ember" style={style} />)}
                    </div>
                )}
                <div className="grain" />
            </div>
            <div className="start-bg-content">{children}</div>
        </div>
    );
}
