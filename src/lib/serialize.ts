/**
 * Recursively converts Prisma Decimal and BigInt objects to plain values.
 * Must be called on server-side data before passing to Client Components.
 */

type PlainObject = Record<string, unknown>;

export function serializeDecimal<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return data.toString() as T;
  }

  if (typeof data === "object" && typeof data !== "function") {
    // Handle Prisma Decimal instances
    if (typeof (data as Record<string, unknown>).toNumber === "function") {
      return Number(data as unknown as number) as T;
    }

    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString() as T;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => serializeDecimal(item)) as T;
    }

    // Handle plain objects
    const result: PlainObject = {};
    for (const key of Object.keys(data as PlainObject)) {
      result[key] = serializeDecimal((data as PlainObject)[key]);
    }
    return result as T;
  }

  return data;
}
