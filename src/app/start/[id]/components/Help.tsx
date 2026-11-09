import { ReactNode } from "react";

/** Explication secondaire, repliée par défaut. */
export default function Help({ children, summary = "Pourquoi ?" }: Readonly<{ children: ReactNode, summary?: string }>) {
    return (
        <details className="help">
            <summary>{summary}</summary>
            <div className="help-body">{children}</div>
        </details>
    );
}
