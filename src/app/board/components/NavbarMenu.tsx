"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LogOut, Menu, Moon, MonitorSmartphone, Sun, CircleUser } from "lucide-react";
import { useSession } from "@/app/hooks/useSession";
import { useTheme, ThemePreference } from "@/app/hooks/useTheme";
import { logOut } from "@/lib/auth";
import "./navbarMenu.css";
import { config } from "@/lib/config";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Clair", icon: <Sun size={16} /> },
    { value: "dark", label: "Sombre", icon: <Moon size={16} /> },
    { value: "auto", label: "Auto", icon: <MonitorSmartphone size={16} /> },
];

/**
 * Menu ouvrable unique regroupant le réglage du thème et la déconnexion.
 * - `variant="inline"` : s'insère dans le flux de la navbar bureau (position relative).
 * - `variant="floating"` : se positionne en `fixed` en haut à droite de l'écran,
 *   utilisé sur mobile dans la vue Profil (la navbar bureau y étant masquée).
 *
 * Utilise le même `useTheme` partagé que le reste de l'app : changer le thème ici
 * met instantanément à jour tous les autres composants qui l'utilisent.
 */
export default function NavbarMenu({ variant = "inline" }: { variant?: "inline" | "floating" }) {
    const { user } = useSession();
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    return (
        <div ref={containerRef} className={`navbar-menu navbar-menu-${variant}`}>
            <button
                type="button"
                className="navbar-menu-trigger"
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Ouvrir le menu"
            >
                <Menu size={20} />
            </button>

            {open && (
                <div className="navbar-menu-panel">
                    <div className="navbar-menu-section">
                        <div className="navbar-menu-section-label">Thème</div>
                        <div className="navbar-menu-group">
                            {THEME_OPTIONS.map((option) => {
                                const isSelected = theme === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setTheme(option.value)}
                                        aria-pressed={isSelected}
                                        className={`navbar-menu-item ${isSelected ? "selected" : ""}`}
                                    >
                                        <span className="navbar-menu-item-icon">{option.icon}</span>
                                        <span className="navbar-menu-item-label">{option.label}</span>
                                        {isSelected && <Check size={16} className="navbar-menu-item-check" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {user && (
                        <>
                            <div className="navbar-menu-divider" />
                            <div className="navbar-menu-section">
                                <div className="navbar-menu-section-label">Compte</div>
                                <div className="navbar-menu-group">
                                  <button
                                    type="button"
                                    className="navbar-menu-item"
                                    onClick={() => {
                                      const url = new URL(config.AUTH_URL);
                                      url.searchParams.set("redirect", globalThis.location.href);
                                      url.searchParams.set("appname", "Heatboard");
                                      globalThis.location.href = url.toString();
                                    }}
                                  >
                                        <span className="navbar-menu-item-icon">
                                            <CircleUser size={16} />
                                        </span>
                                    <span className="navbar-menu-item-label">Compte Chauffagistes</span>
                                  </button>
                                    <button
                                        type="button"
                                        className="navbar-menu-item navbar-menu-item-danger"
                                        onClick={async () => {
                                            await logOut();
                                            globalThis.location.reload();
                                        }}
                                    >
                                        <span className="navbar-menu-item-icon">
                                            <LogOut size={16} />
                                        </span>
                                        <span className="navbar-menu-item-label">Déconnexion</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
