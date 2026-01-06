export function toStringOrNull(v: unknown): string | null {
    return v == null ? null : String(v);
}

export function toString(v: unknown): string {
    return String(v);
}

export function toBoolean(v: unknown): boolean {
    return Boolean(v);
}