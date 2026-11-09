export type PaymentStatus = "waiting" | "pending" | "sent" | "cancelled";

export type RequiredAction = "address_missing" | "address_confirmation_required";

export type PaymentUpdate = {
    id: string;
    fromStatus: PaymentStatus | null;
    toStatus: PaymentStatus;
    actor: string;
    note: string | null;
    txid: string | null;
    created_at: string;
};

export type Payment = {
    id: string;
    block: number;
    workername: string;
    part: string;
    amountSatoshi: number;
    btc_address: string | null;
    addressFrozenAt: string | null;
    status: PaymentStatus;
    txid: string | null;
    updates: PaymentUpdate[];
    blockRef: { height: number; minedAt: string };
};

/** Réponse de `GET /api/payouts`. */
export type Payouts = {
    requiredAction: RequiredAction | null;
    payments: Payment[];
};
