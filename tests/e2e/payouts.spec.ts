import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { expect, test, type Locator, type Page } from "@playwright/test";

const { databaseUrl, adminKey, appUrl, fakeUrl } = JSON.parse(
    readFileSync(join(process.cwd(), "tests/e2e/.state.json"), "utf8"),
) as { databaseUrl: string; adminKey: string; appUrl: string; fakeUrl: string };

const POOL = "bc1qqp9zq4an6nyzhcspz2xfmkcf8rj0p6w94a5gyeu2a7rghxjhnqqsvymz5m";
const ADDRESS = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const MINED_AT = "2026-11-04T16:59:23.000Z";

const db = new Pool({ connectionString: databaseUrl });

async function resetDb() {
    await db.query('TRUNCATE "paymentUpdate", "payment", "block", "workernames", "user" RESTART IDENTITY CASCADE');
}

async function linkWorker(workername: string, user: string) {
    await db.query(
        `INSERT INTO workernames (workername, "user", btc_address, status, code) VALUES ($1, $2, $3, 'done', 'x')`,
        [workername, user, POOL],
    );
}

async function createUser(id: string, address: string | null, confirmedDaysAgo: number | null) {
    await db.query(
        `INSERT INTO "user" (id, address, "confirmedAt") VALUES ($1, $2, now() - ($3 || ' days')::interval)`,
        [id, address, confirmedDaysAgo === null ? null : String(confirmedDaysAgo)],
    );
}

function admin(path: string, init: RequestInit = {}) {
    return fetch(`${appUrl}/api/admin${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${adminKey}`, "Content-Type": "application/json", ...init.headers },
    });
}

async function announceBlock(height: number) {
    const res = await admin("/blocks", { method: "POST", body: JSON.stringify({ height, minedAt: MINED_AT }) });
    expect(res.status).toBe(201);
}

async function injectConfig(page: Page) {
    // Config runtime normalement injectée par /config.js (généré par l'entrypoint Docker).
    await page.route("**/config.js", (route) =>
        route.fulfill({
            contentType: "text/javascript",
            body: `window.__CONFIG__ = ${JSON.stringify({
                BASE_URL: appUrl, API_URL: fakeUrl, HISTORY_API_URL: fakeUrl, BITCOIN_API_URL: fakeUrl,
                AUTH_API_URL: fakeUrl, AUTH_URL: fakeUrl, CKPOOL_API_URL: "",
            })};`,
        }),
    );
}

async function login(page: Page, userId: string, board = POOL) {
    await injectConfig(page);
    await page.context().addCookies([{ name: "e2e_user", value: userId, url: appUrl }]);
    await page.goto(`/board/${board}/pool`);
}

const menuTrigger = (page: Page) => page.getByRole("button", { name: /Ouvrir le menu/ });
/** Badge de statut d'une carte de paiement (le libellé apparaît aussi dans l'audit log). */
const badge = (view: Locator, label: string) => view.locator(".payouts-badge", { hasText: label });
const dot = (page: Page) => page.getByTestId("payouts-attention-dot");

async function openPayouts(page: Page) {
    await menuTrigger(page).click();
    await page.getByRole("link", { name: /Mes paiements de blocks/ }).click();
    await expect(page).toHaveURL(new RegExp(`/board/${POOL}/payouts$`));
    return page.getByRole("region", { name: "Récompenses de blocks" });
}

test.beforeEach(resetDb);
test.afterAll(() => db.end());

test("un membre sans adresse est alerté, la renseigne, et suit son paiement", async ({ page }) => {
    await createUser("u1", null, null);
    await linkWorker("asic1", "u1");
    await announceBlock(900_000);

    await login(page, "u1");
    await expect(dot(page)).toBeVisible();

    const view = await openPayouts(page);
    await expect(view.getByText("Block 900 000")).toBeVisible();
    await expect(view.getByText("2.34375000 BTC")).toBeVisible();
    await expect(view.getByText("En attente de votre adresse").first()).toBeVisible();

    const input = view.getByLabel("Adresse Bitcoin de paiement");
    await input.fill("pas-une-adresse");
    await view.getByRole("button", { name: "Enregistrer et confirmer" }).click();
    await expect(view.getByText("Adresse Bitcoin invalide")).toBeVisible();

    await input.fill(ADDRESS);
    await view.getByRole("button", { name: "Enregistrer et confirmer" }).click();

    await expect(view.getByText("En cours de préparation").first()).toBeVisible();
    await expect(view.getByText(ADDRESS)).toBeVisible();
    await expect(view.getByRole("alert")).toHaveCount(0);
    await expect(view.getByLabel("Historique du paiement").getByRole("listitem")).toHaveCount(2);

    await expect(dot(page)).toHaveCount(0);
});

test("une adresse confirmée il y a plus de 30 jours doit être reconfirmée en un clic", async ({ page }) => {
    await createUser("u1", ADDRESS, 40);
    await linkWorker("asic1", "u1");
    await announceBlock(900_000);

    await login(page, "u1");
    await expect(dot(page)).toBeVisible();

    const view = await openPayouts(page);
    await expect(view.getByText(/pas été confirmée depuis plus d'un mois/)).toBeVisible();
    await view.getByRole("button", { name: "Je confirme cette adresse" }).click();

    await expect(view.getByText("En cours de préparation").first()).toBeVisible();
    await expect(view.getByRole("alert")).toHaveCount(0);
});

test("une adresse confirmée récemment est figée d'office : aucune alerte", async ({ page }) => {
    await createUser("u1", ADDRESS, 5);
    await linkWorker("asic1", "u1");
    await announceBlock(900_000);

    await login(page, "u1");
    await expect(menuTrigger(page)).toBeVisible();
    await expect(dot(page)).toHaveCount(0);

    const view = await openPayouts(page);
    await expect(view.getByText("En cours de préparation").first()).toBeVisible();
    await expect(view.getByText(ADDRESS)).toBeVisible();
});

test("plusieurs blocks simultanés : une seule saisie d'adresse les débloque tous", async ({ page }) => {
    await createUser("u1", null, null);
    await linkWorker("asic1", "u1");
    await Promise.all([900_000, 900_001, 900_002].map(announceBlock));

    await login(page, "u1");
    const view = await openPayouts(page);
    await expect(badge(view, "En attente de votre adresse")).toHaveCount(3);
    await expect(view.getByRole("alert")).toHaveCount(1); // une seule demande pour tous

    await view.getByLabel("Adresse Bitcoin de paiement").fill(ADDRESS);
    await view.getByRole("button", { name: "Enregistrer et confirmer" }).click();

    await expect(badge(view, "En cours de préparation")).toHaveCount(3);
});

test("l'envoi par l'admin apparaît dans l'audit log avec un lien vers la transaction", async ({ page }) => {
    await createUser("u1", ADDRESS, 1);
    await linkWorker("asic1", "u1");
    await announceBlock(900_000);

    const { rows } = await db.query("SELECT id FROM payment WHERE \"user\" = 'u1'");
    const txid = "c".repeat(64);
    const res = await admin(`/payments/${rows[0].id}`, { method: "PATCH", body: JSON.stringify({ status: "sent", txid }) });
    expect(res.status).toBe(200);

    await login(page, "u1");
    const view = await openPayouts(page);
    await expect(view.getByText("Envoyé").first()).toBeVisible();
    await expect(view.getByRole("link", { name: "Voir la transaction" })).toHaveAttribute(
        "href",
        `https://mempool.space/tx/${txid}`,
    );
});

test("un membre ne voit que ses propres paiements", async ({ page }) => {
    await linkWorker("asic1", "u1");
    await createUser("u2", null, null);
    await announceBlock(900_000);

    await login(page, "u2");
    await expect(dot(page)).toHaveCount(0);
    const view = await openPayouts(page);
    await expect(view.getByRole("heading", { name: "Aucune récompense pour le moment" })).toBeVisible();
    await expect(view.getByRole("list", { name: "Comment être payé" }).getByRole("listitem")).toHaveCount(3);
    await expect(view.getByRole("link", { name: "profil" })).toHaveAttribute("href", `/board/${POOL}/my`);
});

test("hors pool communautaire, le menu n'affiche ni section paiements ni alerte", async ({ page }) => {
    await createUser("u1", null, null);
    await linkWorker("asic1", "u1");
    await announceBlock(900_000);

    await login(page, "u1", "bc1qotherpooladdress000000000000000000000000");
    await menuTrigger(page).click();
    await expect(page.getByText("Compte Chauffagistes")).toBeVisible();
    await expect(page.getByRole("link", { name: /Mes paiements de blocks/ })).toHaveCount(0);
    await expect(dot(page)).toHaveCount(0);
});

test("un visiteur non connecté n'a aucune section paiements", async ({ page }) => {
    await injectConfig(page);
    await page.goto(`/board/${POOL}/pool`);
    await menuTrigger(page).click();
    await expect(page.getByRole("link", { name: /Mes paiements de blocks/ })).toHaveCount(0);
});

test("la page paiements est accessible directement par son URL et occupe toute la zone de contenu", async ({ page }) => {
    await createUser("u1", ADDRESS, 1);
    await linkWorker("asic1", "u1");
    await announceBlock(900_000);

    await injectConfig(page);
    await page.context().addCookies([{ name: "e2e_user", value: "u1", url: appUrl }]);
    await page.goto(`/board/${POOL}/payouts`);

    const view = page.getByRole("region", { name: "Récompenses de blocks" });
    await expect(view.getByText("Block 900 000")).toBeVisible();
    const box = await view.boundingBox();
    expect(box!.width).toBeGreaterThan(900); // plus de popup de 400px : la vue prend la largeur disponible
    expect(box!.height).toBeGreaterThan(500);
});
