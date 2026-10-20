export function convertDimension(value: string, from: string, to: string): string {
  if (from === to || !value.trim()) return value;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return value;
  return String(Number((number * (to === "metres" ? 0.3048 : 1 / 0.3048)).toFixed(3)));
}

export function approximateArea(length: string, width: string): string | null {
  const area = Number(length) * Number(width);
  return length.trim() &&
    width.trim() &&
    Number(length) > 0 &&
    Number(width) > 0 &&
    Number.isFinite(area)
    ? area.toLocaleString("en-IN", { maximumFractionDigits: 1 })
    : null;
}
