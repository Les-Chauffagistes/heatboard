import Image from "next/image";
import { Lock } from "lucide-react";
import { ComponentType } from "react";
import styles from "./landing.module.css";

export type ScreenshotChip = {
    Icon: ComponentType<{ size?: number }>;
    value: string;
    label: string;
    position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
};

type Props = {
    srcLight: string;
    srcDark: string;
    alt: string;
    width: number;
    height: number;
    address: string;
    tilt?: "left" | "right";
    chips?: ScreenshotChip[];
};

export default function ScreenshotFrame({ srcLight, srcDark, alt, width, height, address, tilt = "left", chips = [] }: Readonly<Props>) {
    return (
        <div className={`${styles.screenshotStage} ${tilt === "left" ? styles.tiltLeft : styles.tiltRight}`}>
            <div className={styles.windowFrame}>
                <div className={styles.windowTitlebar}>
                    <div className={styles.windowDots}>
                        <span /><span /><span />
                    </div>
                    <div className={styles.windowAddress}>
                        <Lock size={11} />
                        <span>{address}</span>
                    </div>
                </div>
                <div className={styles.windowBody}>
                    {/* Les deux images sont rendues côté serveur ; le CSS choisit laquelle
                        afficher (prefers-color-scheme + data-theme), sans JS ni mismatch SSR. */}
                    <Image
                        src={srcLight}
                        alt={alt}
                        width={width}
                        height={height}
                        className={`${styles.themeScreenshot} ${styles.themeScreenshotLight}`}
                        style={{ width: "100%", height: "auto" }}
                    />
                    <Image
                        src={srcDark}
                        alt={alt}
                        width={width}
                        height={height}
                        className={`${styles.themeScreenshot} ${styles.themeScreenshotDark}`}
                        style={{ width: "100%", height: "auto" }}
                    />
                </div>
            </div>

            {chips.map(({ Icon, value, label, position }) => (
                <div key={label} className={`${styles.floatingChip} ${styles[`chip${position.charAt(0).toUpperCase()}${position.slice(1)}`]}`}>
                    <div className={styles.floatingChipIcon}>
                        <Icon size={15} />
                    </div>
                    <div>
                        <div className={styles.floatingChipValue}>{value}</div>
                        <div className={styles.floatingChipLabel}>{label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
