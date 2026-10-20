export interface CleanWorkerHashrate {
    workername: string
    hashrate1m: number
    hashrate5m: number
    hashrate1h: number
    hashrate1d: number
    hashrate7d: number
    lastshare: number
    shares: number
    bestshare: number
    bestever: number
    weight: number
    rewardBtc?: number 
}