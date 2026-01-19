// lib/form/required.ts
export function hasMissingRequired<T extends Record<string, any>>(
  values: T,
  requiredKeys: readonly (keyof T)[]
) {
  return requiredKeys.some((k) => {
    const v = values[k];
    return v == null || (typeof v === "string" && !v.trim());
  });
}
