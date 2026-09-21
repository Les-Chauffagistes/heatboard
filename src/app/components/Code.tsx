"use client";

import React, { useState } from "react";
import { Check, Copy, LucideProps } from "lucide-react";
import { ForwardRefExoticComponent } from "react";
import { IBM_Plex_Mono } from "next/font/google";

// Premier usage volontaire du mono (IBM Plex Mono) : jusqu'ici `<code>` héritait
// juste de la police monospace par défaut du navigateur/OS, jamais un vrai choix.
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: "400" });

export default function Code({
  children,
  notCopiable = false,
}: Readonly<{ children: React.ReactNode; notCopiable?: boolean }>) {
  const [Icon, setIcon] =
    useState<ForwardRefExoticComponent<LucideProps>>(Copy);

  return (
    <code
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: 7,
        padding: "5px 10px",
        color: "var(--accent)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "fit-content",
        maxWidth: "100%",
      }}
      className={`break ${ibmPlexMono.className}`}
    >
      {children}
      {!notCopiable && (
        <button
          style={{
            color: "white",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          onClick={async () => {
            const text = React.Children.toArray(children).join("");
            await navigator.clipboard.writeText(text);

            setIcon(Check);
            setTimeout(() => setIcon(Copy), 1000);
          }}
        >
          <Icon size={14} color="var(--foreground)" />
        </button>
      )}
    </code>
  );
}