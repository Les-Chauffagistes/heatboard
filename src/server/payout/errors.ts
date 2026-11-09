export class PayoutError extends Error {
    constructor(message: string, readonly status: number, readonly code: string) {
        super(message);
        this.name = new.target.name;
    }
}

export class ConflictError extends PayoutError {
    constructor(message: string) { super(message, 409, "conflict"); }
}

export class NotFoundError extends PayoutError {
    constructor(message: string) { super(message, 404, "not_found"); }
}

export class ValidationError extends PayoutError {
    constructor(message: string) { super(message, 422, "invalid"); }
}

/** history-server ou bitcoin-service indisponible : rien n'est enregistré. */
export class UpstreamError extends PayoutError {
    constructor(message: string, readonly cause?: unknown) { super(message, 502, "upstream"); }
}
