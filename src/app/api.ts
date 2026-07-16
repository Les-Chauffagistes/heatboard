import { UserInstantStats } from "../../models/API Payloads/Stats";
import { PoolHistoryRecord } from "../../models/API Payloads/PoolHistoryRecord";
import { WorkerHistoryRecord } from "../../models/API Payloads/WorkerHistoryRecord";
import { BitcoinPrice } from "../../models/API Payloads/BitcoinPrice";
import { WorkerLinkCode } from "../../models/API Payloads/WorkerLinkCode";
import { LinkedWorkers } from "../../models/API Payloads/LinkedWorkers";
import { config } from "@/lib/config";

/**
 * Statistiques instantanées d'un User
 * @param address Adresse sur laquelle effectuer la recherche
 * @returns Détails généraux du user et de tous les workers
 */
export async function getPoolStats(address: string): Promise<UserInstantStats> {
    return await fetch(`${config.API_URL}/api/stats/${address}`).then((res) => res.json());
}

/**
 * Historique des statistiques d'un unique worker au sein d'un User
 * @param userAddress Adresse sur laquelle effectuer la recherche
 * @param workerName Nom du worker
 * @param period 30d ou forever. 
 * - Si 30d: 1 point toutes les 30 mins via hypertable
 * - Si forever: 1 point tous les jours via hypertable
 * @returns WorkerHistoryRecord[]
 */
export async function getWorkerStatsHistory(userAddress: string, workerName: string, period: "daily" | "forever"): Promise<WorkerHistoryRecord[]> {
    return await fetch(`${config.HISTORY_API_URL}/v1/${userAddress}/worker/${workerName}/${period}`).then((res) => res.json());
}

/**
 * Historique sur 30j du hashrate 1h, du hashrate 24h et du poids du pool
 * @param userAddress Adresse sur laquelle effectuer la recherche
 * @returns PoolHistoryRecord[]
 */
export async function getPoolHistory(userAddress: string): Promise<PoolHistoryRecord[]> {
    return await fetch(`${config.HISTORY_API_URL}/v1/${userAddress}/pool`).then((res) => res.json());
}

/**
 * Poids des workers
 * @param userAddress Adresse sur laquelle effectuer la recherche 
 * @returns 
 */
export async function getPoolWeight(userAddress: string) {
    return await fetch(`${config.HISTORY_API_URL}/v1/${userAddress}/weights`).then((res) => res.json());
}

/**
 * Prix du Bitcoin
 * @returns BitcoinPrice
 */
export async function getBtcPrice(): Promise<BitcoinPrice> {
    return await fetch(`${config.BITCOIN_API_URL}/v1/bitcoin-price`).then((res) => res.json());
}

/**
 * Récompense de block du réseau Bitcoin
 * @returns number
 */
export async function getBtcBlockReward(): Promise<number> {
    return await fetch(`${config.BITCOIN_API_URL}/v1/bitcoin-block-reward`).then((res) => res.json());
}

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