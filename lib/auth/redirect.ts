export function sanitizeNextPath(
  raw: string | null,
  fallback = "/musician"
): string {
  return raw?.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
