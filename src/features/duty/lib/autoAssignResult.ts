export function getAutoAssignCollectionCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

export function toAutoAssignArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
