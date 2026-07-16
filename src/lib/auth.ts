import { config } from "@/lib/config";
import { components } from "@les-chauffagistes/authentication-types"

async function authFetch(input: RequestInfo, init?: RequestInit, cookieHeader?: string) {
    const headers = cookieHeader ? { ...init?.headers, cookie: cookieHeader } : init?.headers;
    const credentials = cookieHeader ? undefined : "include" as const;

    let res = await fetch(input, { ...init, headers, credentials });

    if (res.status === 401 && !cookieHeader) {
        const refreshed = await refreshToken();
        if (!refreshed) return res;
        res = await fetch(input, { ...init, headers, credentials });
    }

    return res;
}

export async function getMe(cookieHeader?: string): Promise<components["schemas"]["User"] | null> {
    const url = `${config.AUTH_API_URL}/me`;
    const res = await authFetch(url, undefined, cookieHeader);
    if (!res.ok) return null;
    return res.json();
}

export async function refreshToken() {
    return await fetch(`${config.AUTH_API_URL}/refresh`, {credentials: "include", method: "POST"});
}

export async function logOut() {
    await fetch(`${config.AUTH_API_URL}/logout`, {
        method: "DELETE",
        credentials: "include",
        mode: "cors"
    })
}