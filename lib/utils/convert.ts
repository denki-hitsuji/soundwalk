export function toStringOrNull(v: unknown): string | null {
    return v == null ? null : String(v);
}

export function toString(v: unknown): string {
    return String(v);
}

export function toBoolean(v: unknown): boolean {
    return Boolean(v);
}

export function toPlainError(e: unknown) {
  if (e instanceof Error) return { message: e.message, name: e.name };
  return { message: String(e), name: "UnknownError" };
}
