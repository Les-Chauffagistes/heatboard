"use client";

import { useEffect, useRef, useState } from "react";
import { addresssExists } from "@/app/api";

export default function AddressSearch() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (inputRef.current && inputRef.current.value !== search) {
            setSearch(inputRef.current.value);
        }
    }, [search]);

    function searchHandler() {
        addresssExists(search).then((res) => {
            if (res === true) {
                globalThis.location.href = "/board/" + search + "/workers";
            }
        });
    }

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
        }}>
            <input style={{
                padding: "5px 10px",
                fontSize: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--card-outline-color)",
                backgroundColor: "var(--input-background-color)",
            }} type="text" autoFocus={true} capture={"environment"} placeholder="Adresse Bitcoin"
                onChange={(e) => setSearch(e.target.value)} ref={inputRef} value={search}
                onKeyDown={(e) => { if (e.key === "Enter") searchHandler(); }} />
            <button className="secondary" onClick={searchHandler}>
                Rechercher
            </button>
        </div>
    );
}
