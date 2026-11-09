import { describe, expect, it } from "vitest";
import { isAdminRequest } from "../adminAuth";

const req = (authorization?: string) =>
    new Request("http://localhost/api/admin/blocks", { headers: authorization ? { Authorization: authorization } : {} });

describe("isAdminRequest", () => {
    it("accepte la bonne clé", () => {
        expect(isAdminRequest(req("Bearer secret"), "secret")).toBe(true);
    });

    it("refuse une mauvaise clé, un schéma différent ou l'absence d'en-tête", () => {
        expect(isAdminRequest(req("Bearer nope!!"), "secret")).toBe(false);
        expect(isAdminRequest(req("Bearer nope"), "secret")).toBe(false);
        expect(isAdminRequest(req("Basic secret"), "secret")).toBe(false);
        expect(isAdminRequest(req(), "secret")).toBe(false);
    });

    it("refuse tout si la clé n'est pas configurée", () => {
        expect(isAdminRequest(req("Bearer "), "")).toBe(false);
        expect(isAdminRequest(req("Bearer undefined"), undefined)).toBe(false);
    });
});
