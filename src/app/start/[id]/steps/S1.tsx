import { workernameAvailable } from "@/app/api";
import { CSSProperties, useEffect, useState } from "react";
import Step from "../components/Step";


/**
 * Choisir un workername
 * @param param0 
 * @returns 
 */
export default function S1({ userAddress, next }: { userAddress: string, next: (psuedo: string) => Promise<string | undefined> }) {
    const [value, setValue] = useState<string | null>(null);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [message, setMessage] = useState<{ content: string, color: string }>({ content: "", color: "" });

    useEffect(() => {
        if (!value) {
            setAvailable(null);
            return;
        }
        const timer = setTimeout(() => {
            workernameAvailable(userAddress, value).then(setAvailable);
        }, 500);
        return () => clearTimeout(timer);
    }, [value, userAddress]);

    const pStyle: CSSProperties = {
        marginTop: 5,
        marginLeft: 5
    }

    useEffect(() => {
        if (available === null) {
            setMessage({ content: "Choissez un workername", color: "" });
        } else {
            setMessage({ content: available ? "Ce workername est disponible" : "Ce workername n'est pas disponible", color: available ? "green" : "red" });
        }
    }, [available]);

    return (

        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%"
        }}>
            <Step number={1} title="Réserver un workername" />
            <p>
                Vous allez réserver un nom que vos appareils de minage vont utiliser pour se connecter à la pool. Ce nom doit être unique. Vous pouvez utiliser votre pseudo comme workername, à condition que ce nom soit disponible.
            </p>
            <p>
                Les appareils portant ce nom seront définitivement liés à votre compte chez Les Chauffagistes, et associé à l&apos;adresse de paiement que vous définierez plus tard.
            </p>
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
                flexDirection: "column",

            }}>
                <div id="input-container" style={{
                    display: "flex",
                    flexDirection: "column",

                    flex: 1,
                    alignContent: "center",
                    justifyContent: "center"
                }}>
                    <input type="text" onChange={(e) => setValue(e.target.value)} style={{
                        padding: "10px 15px",
                        textAlign: "center",
                        fontSize: "1rem",
                        borderRadius: 10,

                        display: "flex",
                        width: "100%",
                        alignSelf: "center",
                    }} />
                    <p style={{ ...pStyle, color: message.color }}>{message.content}</p>
                </div>
                <button onClick={() => {
                    if (value && available && value) {
                        next(value).then(
                            res => {
                                if (res) {
                                    switch (res) {
                                        case "Already exists":
                                            setMessage({ content: "Ce workername est indisponible", color: "red" });
                                            break;

                                        case "":
                                            break;

                                        default:
                                            setMessage({ content: "Erreur inattendue", color: "red" });
                                            break
                                    }
                                }
                            }
                        )

                    }
                }} className="primary">Continuer</button>
            </div>
        </div>

    )
}