import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "auto";

const THEME_STORAGE_KEY = "theme";

type ThemeState = { theme: ThemePreference; isDark: boolean };

function getStoredTheme(): ThemePreference {
    if (typeof window === "undefined") return "auto";
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "auto") return stored;
    return "auto";
}

function getSystemPrefersDark(): boolean {
    return globalThis?.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

function resolveIsDark(theme: ThemePreference): boolean {
    if (theme === "auto") return getSystemPrefersDark();
    return theme === "dark";
}

function applyDomTheme(isDark: boolean) {
    if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    }
}

// Store externe (module-level) partagé par tous les composants utilisant useTheme,
// afin que le changement de thème depuis n'importe quel composant (navbar, menu
// mobile, page profil, ...) se répercute instantanément sur tous les autres,
// sans avoir besoin d'un Context/Provider.
let state: ThemeState = { theme: "auto", isDark: true };
let initialized = false;
const listeners = new Set<() => void>();

function setState(next: ThemeState) {
    state = next;
    applyDomTheme(state.isDark);
    listeners.forEach((listener) => listener());
}

function init() {
    if (initialized || typeof window === "undefined") return;
    initialized = true;

    const stored = getStoredTheme();
    setState({ theme: stored, isDark: resolveIsDark(stored) });

    globalThis?.matchMedia?.("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
            if (state.theme === "auto") setState({ theme: "auto", isDark: e.matches });
        });

    // Garde plusieurs onglets/fenêtres synchronisés entre eux.
    window.addEventListener("storage", (e) => {
        if (e.key !== THEME_STORAGE_KEY) return;
        const next = getStoredTheme();
        setState({ theme: next, isDark: resolveIsDark(next) });
    });
}

function subscribe(listener: () => void) {
    init();
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): ThemeState {
    return state;
}

// Doit être une référence stable : useSyncExternalStore boucle indéfiniment si
// getServerSnapshot renvoie un nouvel objet à chaque appel.
const serverSnapshot: ThemeState = { theme: "auto", isDark: true };

function getServerSnapshot(): ThemeState {
    return serverSnapshot;
}

/**
 * Source de vérité partagée pour la préférence de thème ("light" | "dark" | "auto"),
 * persistée dans localStorage sous la clé "theme" (même schéma que "activeColumns"
 * dans workers/page.tsx). Résout le booléen effectif `isDark` en combinant la
 * préférence stockée avec `prefers-color-scheme` quand la préférence est "auto".
 * Tous les composants appelant ce hook partagent le même état : changer le thème
 * depuis un composant met à jour tous les autres instantanément.
 */
export function useTheme() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setTheme = useCallback((next: ThemePreference) => {
        if (typeof window !== "undefined") localStorage.setItem(THEME_STORAGE_KEY, next);
        setState({ theme: next, isDark: resolveIsDark(next) });
    }, []);

    return { theme: snapshot.theme, isDark: snapshot.isDark, setTheme };
}
