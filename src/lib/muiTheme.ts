import { createTheme } from "@mui/material/styles";

// Thème MUI partagé par les pages qui embarquent des composants MUI (ag-grid,
// @mui/x-charts). Sans `typography.fontFamily`, MUI retombe sur sa police par
// défaut (Roboto/Helvetica) pour tout ce qui passe par <Typography> ou par le
// texte SVG des graphiques — Archivo (posée sur <body> dans ThemeBody.tsx)
// n'est alors jamais appliquée à ce contenu-là, même si elle l'est partout
// ailleurs dans l'app.
export function createAppTheme(isDark: boolean) {
    return createTheme({
        palette: { mode: isDark ? "dark" : "light" },
        typography: {
            fontFamily: "var(--font-archivo), Arial, Helvetica, sans-serif",
        },
    });
}
