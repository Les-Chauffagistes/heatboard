import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';


/** `handler` peut être asynchrone ; la popup ne se ferme que s'il ne renvoie pas `false`. `error` s'affiche au-dessus du bouton. */
export default function Popup({ children, title, setOpen, open, handler = () => {}, error = null, maxWidth = 400 }: Readonly<{ title: string, children: React.ReactNode, open: boolean, setOpen: (open: boolean) => void, handler?: () => void | boolean | Promise<void | boolean>, error?: string | null, maxWidth?: number }>) {
    const [pending, setPending] = useState(false);

    async function submit() {
        setPending(true);
        try {
            if (await handler() !== false) setOpen(false);
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Overlay style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.1)',
                backdropFilter: "blur(10px)",
                zIndex: 100
            }} className="DialogOverlay" />
            <Dialog.Content style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: "var(--card-background-color)",
                border: "solid 1px var(--card-outline-color)",
                borderRadius: 20,
                padding: 20,
                zIndex: 101,
                width: "80%",
                height: "80%",
                maxWidth,
                maxHeight: 300,
                marginTop: 30,
                display: "flex",
                flexDirection: "column",
            }}>
                <Dialog.Title style={{ textAlign: "center", marginBottom: "2rem" }}>{title}</Dialog.Title>
                {children}
                {error && <p role="alert" style={{ color: "var(--error-color, #d33)", margin: "0.5rem 0 0" }}>{error}</p>}
                <div style={{
                    margin: "auto 0px 0px auto",
                }}>
                    <button onClick={submit} disabled={pending} className="primary">OK</button>
                </div>

            </Dialog.Content>
        </Dialog.Root>
    )
}