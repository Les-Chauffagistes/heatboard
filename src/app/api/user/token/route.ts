import { NextResponse } from "next/server";
import { encrypt } from "@/server/websockets";
import { getMe } from "@/lib/auth";
import { getServerCookieHeader } from "@/lib/auth.server";

export async function GET() {
    const user = await getMe(await getServerCookieHeader());
    if (!user) {
        return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }
    const encryptedToken = encrypt(user.user_id);
    return NextResponse.json({ token: encryptedToken });
}