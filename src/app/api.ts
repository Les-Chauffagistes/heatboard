import { WorkerLinkCode } from "../../models/API Payloads/WorkerLinkCode";
import { LinkedWorkers } from "../../models/API Payloads/LinkedWorkers";


/**
 * Vérifie si une adresse est utilisée chez les Chauffagistes.
 * @param address Adresse Bitcoin à chercher
 * @returns boolean
 */
export async function addresssExists(address: string): Promise<boolean> {
    return (await fetch(`/api/${address}/exists`).then((res) => res.json())).exists;
}

/**
 * Renvoie la liste des workernames liés à l'utilisateur.
 * Actuellement nous ne permettons qu'un seul workername par utilisateur.
 * @param address Adresse Bitcoin de l'utilisateur sur laquelle l'association existe
 * @returns Liste de LinkedWorkers
 */
export async function getLinkedWorkers(address: string): Promise<LinkedWorkers[]> {
    return (await fetch(`/api/${address}/workernames`).then((res) => res.json()))
}

export async function workernameAvailable(address: string, workername: string): Promise<boolean> {
    return !(await fetch(`/api/${address}/workernames/${workername}`).then((res) => res.json())).exists
}

/**
 * Dépose une réservation du workername. L'API vérifie que la réservatione est possible, c'est à dire :
 * - L'utilisateur n'a pas encore fait de réservation
 * - Le workername n'a pas encore été réservé
 * @param address Adresse Bitcoin sur laquelle l'association est demandée
 * @param workername Nom du workername à associer
 * @returns Payload d'association avec le statut
 * - Pending : Cet utilisateur a déjà généré un code, on l'affiche à nouveau.
 * - Done : L'utilisateur a terminé l'association et possède ce workername.
 */
export async function registerWorkername(address: string, workername: string): Promise<WorkerLinkCode | { error: string }> {
    return (await fetch(`/api/${address}/workernames/${workername}`, { method: "POST" }).then((res) => res.json()))
}

export async function getUserToken(): Promise<string> {
    return (await fetch("/api/user/token").then((res) => res.json())).token
}

export async function patchUser(data: { address?: string }) {
    return (await fetch("/api/user", { method: "PATCH", body: JSON.stringify(data) }).then((res) => res.json()))
}