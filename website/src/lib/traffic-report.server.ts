import { trafficDevices, trafficPages, trafficSources } from "./traffic.ts";
import type { TrafficReport } from "./traffic.ts";

type ObjectValue = Record<string, unknown>;
const invalid = "The site traffic report is unavailable.";
const dayLength = 24 * 60 * 60 * 1000;
const istOffset = 330 * 60 * 1000;

function object(value: unknown): value is ObjectValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function count(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 1_000_000_000)
    throw new Error(invalid);
  return Number(value);
}

function isoDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function timestamp(value: unknown): number {
  if (typeof value !== "string" || value.length > 40) throw new Error(invalid);
  const parts = value.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-](\d{2}):(\d{2}))$/,
  );
  if (
    !parts ||
    parts[0] !== value ||
    !isoDay(parts[1]) ||
    Number(parts[2]) > 23 ||
    Number(parts[3]) > 59 ||
    Number(parts[4]) > 59 ||
    (parts[5] !== undefined && Number(parts[5]) > 23) ||
    (parts[6] !== undefined && Number(parts[6]) > 59) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error(invalid);
  return Date.parse(value);
}

function buckets<T extends string>(
  value: unknown,
  key: "page" | "source" | "device",
  labels: readonly T[],
  pageViews: number,
): { bucket: T; pageViews: number }[] {
  if (!Array.isArray(value) || value.length !== labels.length) throw new Error(invalid);
  const seen = new Set<T>();
  const rows = value.map((entry: unknown) => {
    if (!object(entry) || typeof entry[key] !== "string") throw new Error(invalid);
    const bucket = labels.find((label) => label === entry[key]);
    if (bucket === undefined || seen.has(bucket)) throw new Error(invalid);
    seen.add(bucket);
    return { bucket, pageViews: count(entry.pageViews) };
  });
  if (rows.reduce((total, row) => total + row.pageViews, 0) !== pageViews) throw new Error(invalid);
  return rows;
}

/** Only complete aggregate series and fixed labels may reach the private dashboard. */
export function trafficReport(value: unknown, days: 7 | 30 | 90): TrafficReport {
  try {
    if (
      ![7, 30, 90].includes(days) ||
      !object(value) ||
      value.enabled !== true ||
      value.days !== days ||
      value.timeZone !== "Asia/Kolkata" ||
      !object(value.summary) ||
      !isoDay(value.from) ||
      !isoDay(value.through) ||
      !Array.isArray(value.daily) ||
      value.daily.length !== days
    )
      throw new Error(invalid);
    const asOf = timestamp(value.asOf);
    const expectedThrough = new Date(asOf + istOffset).toISOString().slice(0, 10);
    const midnight = Date.parse(expectedThrough + "T00:00:00.000Z");
    const firstDay = midnight - (days - 1) * dayLength;
    const expectedFrom = new Date(firstDay).toISOString().slice(0, 10);
    if (value.through !== expectedThrough || value.from !== expectedFrom) throw new Error(invalid);
    const summary = {
      pageViews: count(value.summary.pageViews),
      visitorDays: count(value.summary.visitorDays),
      recentVisitors: count(value.summary.recentVisitors),
      leads: count(value.summary.leads),
    };
    if (summary.visitorDays > summary.pageViews || summary.recentVisitors > summary.visitorDays)
      throw new Error(invalid);
    const daily = value.daily.map((entry: unknown, index: number) => {
      if (
        !object(entry) ||
        !isoDay(entry.date) ||
        entry.date !== new Date(firstDay + index * dayLength).toISOString().slice(0, 10)
      )
        throw new Error(invalid);
      const row = {
        date: entry.date,
        pageViews: count(entry.pageViews),
        visitorDays: count(entry.visitorDays),
        leads: count(entry.leads),
      };
      if (row.visitorDays > row.pageViews) throw new Error(invalid);
      return row;
    });
    for (const field of ["pageViews", "visitorDays", "leads"] as const) {
      if (daily.reduce((total, row) => total + row[field], 0) !== summary[field])
        throw new Error(invalid);
    }
    const pages = buckets(value.pages, "page", trafficPages, summary.pageViews).map((row) => ({
      page: row.bucket,
      pageViews: row.pageViews,
    }));
    const sources = buckets(value.sources, "source", trafficSources, summary.pageViews).map(
      (row) => ({ source: row.bucket, pageViews: row.pageViews }),
    );
    const devices = buckets(value.devices, "device", trafficDevices, summary.pageViews).map(
      (row) => ({ device: row.bucket, pageViews: row.pageViews }),
    );
    return {
      enabled: true,
      days,
      timeZone: "Asia/Kolkata",
      asOf: value.asOf as string,
      from: value.from,
      through: value.through,
      summary,
      daily,
      pages,
      sources,
      devices,
    };
  } catch {
    throw new Error(invalid);
  }
}
