export default class ExtractWorkername {
    static fromPool(addressAndName: string): string | null {
        if (addressAndName.includes(".")) {
            const parts = addressAndName.split(".");
            if (parts.length > 1) {
                return parts[1];
            }
        }
        return null;
    }
}