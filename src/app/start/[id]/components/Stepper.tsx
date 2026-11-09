function stepState(n: number, current: number) {
    if (n < current) return "done";
    return n === current ? "current" : "todo";
}

export default function Stepper({ labels, current }: Readonly<{ labels: string[], current: number }>) {
    return (
        <ol className="stepper" aria-label="Progression">
            {labels.map((label, i) => {
                const n = i + 1;
                const state = stepState(n, current);
                return (
                    <li key={label} className={`stepper-item ${state}`} aria-current={state === "current" ? "step" : undefined}>
                        <span className="stepper-dot">{state === "done" ? "✓" : n}</span>
                        <span className="stepper-label">{label}</span>
                    </li>
                );
            })}
        </ol>
    );
}
