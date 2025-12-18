/**
 * Deterministic JSON serializer with stable key ordering.
 * Produces compact JSON with keys sorted lexicographically.
 */
export function stableStringify(value: any): string {
  return serialize(value);
}

function serialize(value: any): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const items = value.map((v) => serialize(v));
    return '[' + items.join(',') + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    const parts = keys.map((k) => JSON.stringify(k) + ':' + serialize(value[k]));
    return '{' + parts.join(',') + '}';
  }
  // fallback
  return JSON.stringify(value);
}

export default stableStringify;
