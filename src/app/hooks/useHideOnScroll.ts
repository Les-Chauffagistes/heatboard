"use client";

import { useCallback, useEffect, useState } from "react";

type Options = {
    /** Amplitude minimale (px) d'un geste de scroll avant de basculer l'état, évite le jitter. */
    threshold?: number;
    /** En dessous de cette distance du haut (px), la barre reste toujours visible. */
    topOffset?: number;
    /** À moins de cette distance du bas (px), la barre reste toujours visible. */
    bottomOffset?: number;
};

/**
 * Observe la direction de scroll d'un conteneur scrollable et notifie via
 * `onScrolledDownChange(true)` quand l'utilisateur scrolle vers le bas (intention
 * de consommer le contenu → on peut masquer la barre) et `false` quand il scrolle
 * vers le haut, qu'il est près du haut, ou près du bas de la liste.
 *
 * Renvoie une callback ref à poser sur l'élément scrollable. On utilise une
 * callback ref plutôt qu'un RefObject car l'élément peut n'être monté qu'après le
 * premier rendu (ex. état de chargement) : la callback se déclenche au montage
 * réel du nœud, là où un RefObject ne relancerait pas l'effet.
 */
export function useHideOnScroll(
    onScrolledDownChange: (scrolledDown: boolean) => void,
    { threshold = 8, topOffset = 64, bottomOffset = 64 }: Options = {}
) {
    const [el, setEl] = useState<HTMLElement | null>(null);
    const ref = useCallback((node: HTMLElement | null) => setEl(node), []);

    useEffect(() => {
        if (!el) return;

        let lastY = el.scrollTop;
        let ticking = false;

        const update = () => {
            ticking = false;
            const y = el.scrollTop;

            // Toujours visible en haut de la liste.
            if (y <= topOffset) {
                onScrolledDownChange(false);
                lastY = y;
                return;
            }

            // Toujours visible quand on atteint le bas.
            if (el.scrollHeight - y - el.clientHeight <= bottomOffset) {
                onScrolledDownChange(false);
                lastY = y;
                return;
            }

            const delta = y - lastY;
            if (Math.abs(delta) > threshold) {
                onScrolledDownChange(delta > 0);
                lastY = y;
            }
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        el.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            el.removeEventListener("scroll", onScroll);
            onScrolledDownChange(false);
        };
    }, [el, onScrolledDownChange, threshold, topOffset, bottomOffset]);

    return ref;
}
