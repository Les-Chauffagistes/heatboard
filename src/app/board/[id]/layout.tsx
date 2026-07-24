import { DesktopNavbar } from "../components/DesktopNavbar";
import MobileNavbar from "../components/MobileNavbar";

export default function Layout({ children }: Readonly<{children: React.ReactNode;}>) {
    return (
        <div style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "var(--background)"
        }}>
            <DesktopNavbar />
            {children}
            <MobileNavbar />
        </div>
    )
}