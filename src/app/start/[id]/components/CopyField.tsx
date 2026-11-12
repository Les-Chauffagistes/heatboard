import Code from "@/app/components/Code";

export default function CopyField({ label, value }: Readonly<{ label: string, value: string }>) {
    return (
        <div className="copy-field">
            <span className="copy-label">{label}</span>
            <Code>{value}</Code>
        </div>
    );
}
