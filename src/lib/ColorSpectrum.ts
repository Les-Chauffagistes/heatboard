export default class ColorSpectrum {
    static hsvToHex(H: number, S: number, V: number): string {
        const h = H / 60;
        const i = Math.floor(h);
        const f = h - i;
        const p = V * (1 - S);
        const q = V * (1 - S * f);
        const t = V * (1 - S * (1 - f));

        let r = 0, g = 0, b = 0;

        switch (i % 6) {
            case 0: r = V; g = t; b = p; break;
            case 1: r = q; g = V; b = p; break;
            case 2: r = p; g = V; b = t; break;
            case 3: r = p; g = q; b = V; break;
            case 4: r = t; g = p; b = V; break;
            case 5: r = V; g = p; b = q; break;
        }

        const R = Math.round(r * 255).toString(16).padStart(2, "0");
        const G = Math.round(g * 255).toString(16).padStart(2, "0");
        const B = Math.round(b * 255).toString(16).padStart(2, "0");

        return `#${R}${G}${B}`;
    }

    static generateColorRange(
        count: number,
        hStart: number,
        hEnd: number,
        s: number = 1,
        v: number = 1
    ): string[] {
        const result: string[] = [];
        if (count <= 1) return [this.hsvToHex(hStart, s, v)];

        for (let i = 0; i < count; i++) {
            const h = hStart + (hEnd - hStart) * (i / (count - 1));
            result.push(this.hsvToHex(h, s, v));
        }
        return result;
    }

    // LCH → Lab → XYZ → linear RGB → sRGB → hex
    static lchToHex(L: number, C: number, H: number): string {
        const hr = (H * Math.PI) / 180;
        const a = C * Math.cos(hr);
        const b = C * Math.sin(hr);

        const y = (L + 16) / 116;
        const x = y + a / 500;
        const z = y - b / 200;

        const xyz = {
            x: 0.95047 * this.fInv(x),
            y: 1.00000 * this.fInv(y),
            z: 1.08883 * this.fInv(z),
        };

        const rgbLin = {
            r: 3.2406 * xyz.x - 1.5372 * xyz.y - 0.4986 * xyz.z,
            g: -0.9689 * xyz.x + 1.8758 * xyz.y + 0.0415 * xyz.z,
            b: 0.0557 * xyz.x - 0.2040 * xyz.y + 1.0570 * xyz.z,
        };

        const r = this.toSrgb(rgbLin.r);
        const g = this.toSrgb(rgbLin.g);
        const b2 = this.toSrgb(rgbLin.b);

        return (
            "#" +
            r.toString(16).padStart(2, "0") +
            g.toString(16).padStart(2, "0") +
            b2.toString(16).padStart(2, "0")
        );
    }

    static fInv(t: number): number {
        const d = 6 / 29;
        return t > d ? t ** 3 : 3 * d * d * (t - 4 / 29);
    }

    static toSrgb(v: number): number {
        const c = v <= 0 ? 0 : v >= 1 ? 1 : v;
        const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        return Math.round(s * 255);
    }

    static generateLchColors(
        count: number,
        L: number = 70,
        C: number = 50,
        hStart: number = 0,
        hEnd: number = 360
    ): string[] {
        const out: string[] = [];
        if (count <= 1) return [this.lchToHex(L, C, hStart)];

        for (let i = 0; i < count; i++) {
            const h = hStart + (hEnd - hStart) * (i / (count - 1));
            out.push(this.lchToHex(L, C, h));
        }
        return out;
    }

    static lchStepRange(
        count: number,
        hStart: number,
        hStep: number,
        L: number = 70,
        C: number = 50
    ): string[] {
        const out: string[] = [];
        for (let i = 0; i < count; i++) {
            const h = hStart + i * hStep;
            out.push(this.lchToHex(L, C, h));
        }
        return out;
    }
}