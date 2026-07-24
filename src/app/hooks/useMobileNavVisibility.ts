"use client";

import { useSyncExternalStore } from "react";

// Store externe (module-level) partagé, dans le même esprit que useTheme :
// l'input de recherche vit dans workers/page.tsx tandis que la MobileNavbar vit
// dans board/[id]/layout.tsx (deux sous-arbres distincts). Un store module-level
// évite d'avoir à envelopper le layout dans un Context/Provider pour partager
// l'état de visibilité de la navbar entre ces deux composants.
type State = { inputFocused: boolean; scrolledDown: boolean };

let state: State = { inputFocused: false, scrolledDown: false };
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// Doit renvoyer une valeur primitive stable : useSyncExternalStore compare par
// référence, un booléen dérivé est donc sûr (pas de boucle infinie).
function getSnapshot(): boolean {
    return state.inputFocused || state.scrolledDown;
}

function getServerSnapshot(): boolean {
    return false;
}

/** Masque la navbar quand l'input a le focus (clavier ouvert). */
export function setMobileNavInputFocused(inputFocused: boolean) {
    if (state.inputFocused === inputFocused) return;
    state = { ...state, inputFocused };
    emit();
}

/** Masque la navbar pendant un scroll vers le bas, la révèle au scroll vers le haut. */
export function setMobileNavScrolledDown(scrolledDown: boolean) {
    if (state.scrolledDown === scrolledDown) return;
    state = { ...state, scrolledDown };
    emit();
}

/**
 * `true` quand la MobileNavbar doit être masquée : soit l'input a le focus
 * (le clavier occupe l'espace), soit l'utilisateur scrolle vers le bas.
 */
export function useMobileNavHidden(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
