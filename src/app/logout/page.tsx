"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logOut } from "@/lib/auth";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        logOut().then(() => router.push("/"));
    }, [router]);

    return null;
}
