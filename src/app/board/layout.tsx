import { Metadata } from "next";
import ThemeBody from "../ThemeBody";

export const metadata: Metadata = {
  title: "Dashboard Chauffagistes",
  description: "Statistiques détaillées des machines de minage",
  openGraph: {
    "images": [
      `${process.env.BASE_URL}/banner.png`
    ]
  },
  twitter: {
    "card": "summary_large_image",
    "images": [
      `${process.env.BASE_URL}/banner.png`
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeBody className={""}>
      {children}
    </ThemeBody>
  );
}