import { patchUser } from "@/app/api";
import { useState } from "react"
import Step from "../components/Step";




export default function S3({next}: {next: (address: string) => void}) {
    const [address, setAddress] = useState<string>("");

    return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%"
            }}>
                <Step number={3} title="Adresse de paiement" />
                <p>Saisissez l&apos;adresse que vous souhaitez utiliser pour recevoir vos paiements.</p>
                <p>Nous vous conseillons d&apos;utiliser un hard wallet dédié et stocké en lieu sur.</p>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                    flexDirection: "column",

                }}>
                    <div className="input-container"style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        alignContent: "center",
                        justifyContent: "center"
                    }}>
                        <input type="text" onChange={(e) => setAddress(e.target.value)} style={{
                            padding: "10px 15px",
                            textAlign: "center",
                            fontSize: "1rem",
                            borderRadius: 10,
                            display: "flex",
                            width: "100%",
                            alignSelf: "center",
                        }} />
                        
                    </div>
                    <button onClick={() => {
                        patchUser({
                            address: address
                        });
                        if (address) next(address);
                    }} className="primary">Terminer</button>
                </div>
            </div>
    )
}