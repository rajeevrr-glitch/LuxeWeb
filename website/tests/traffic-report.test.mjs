import assert from "node:assert/strict";
import { test } from "node:test";
import { trafficReport } from "../src/lib/traffic-report.server.ts";
import { trafficDevices, trafficPages, trafficSources } from "../src/lib/traffic.ts";

const dayLength = 86_400_000;
const message = "The site traffic report is unavailable.";

function fixture(days = 7, asOf = "2026-10-27T12:00:00.123456+00:00") {
  const last = Math.floor((Date.parse(asOf) + 19_800_000) / dayLength) * dayLength;
  const first = last - (days - 1) * dayLength;
  return {
    enabled: true,
    days,
    timeZone: "Asia/Kolkata",
    asOf,
    from: new Date(first).toISOString().slice(0, 10),
    through: new Date(last).toISOString().slice(0, 10),
    summary: { pageViews: 3, visitorDays: 2, recentVisitors: 1, leads: 5 },
    daily: Array.from({ length: days }, (_, index) => ({
      date: new Date(first + index * dayLength).toISOString().slice(0, 10),
      pageViews: index === days - 1 ? 3 : 0,
      visitorDays: index === days - 1 ? 2 : 0,
      leads: index === days - 1 ? 5 : 0,
    })),
    pages: trafficPages.map((page, index) => ({ page, pageViews: index === 0 ? 3 : 0 })),
    sources: trafficSources.map((source, index) => ({ source, pageViews: index === 0 ? 3 : 0 })),
    devices: trafficDevices.map((device, index) => ({ device, pageViews: index === 0 ? 3 : 0 })),
  };
}

function rejects(value, days = 7) {
  assert.throws(
    () => trafficReport(value, days),
    (error) => error instanceof Error && error.message === message,
  );
}

test("all supported report periods accept complete zero-filled aggregate series", () => {
  for (const days of [7, 30, 90]) {
    const value = fixture(days);
    assert.deepEqual(trafficReport(value, days), value);
    assert.equal(value.daily.length, days);
  }
  const empty = fixture();
  empty.summary = { pageViews: 0, visitorDays: 0, recentVisitors: 0, leads: 0 };
  for (const row of empty.daily) {
    row.pageViews = 0;
    row.visitorDays = 0;
    row.leads = 0;
  }
  for (const key of ["pages", "sources", "devices"])
    for (const row of empty[key]) row.pageViews = 0;
  assert.deepEqual(trafficReport(empty, 7), empty);
});

test("canonical dates derive from IST rather than the timestamp text's timezone or UTC date", () => {
  const before = fixture(7, "2026-10-27T18:29:59Z");
  const after = fixture(7, "2026-10-27T18:30:00Z");
  assert.equal(trafficReport(before, 7).through, "2026-10-27");
  assert.equal(trafficReport(after, 7).through, "2026-10-28");
  const offset = fixture(7, "2026-10-27T14:30:00-04:00");
  assert.equal(trafficReport(offset, 7).through, "2026-10-28");
  const leap = fixture(7, "2028-03-01T00:00:00+05:30");
  assert.ok(trafficReport(leap, 7).daily.some((row) => row.date === "2028-02-29"));
});

test("root shape, enablement, requested period and timezone must match exactly", () => {
  for (const value of [
    null,
    [],
    {},
    "private",
    { ...fixture(), enabled: false },
    { ...fixture(), days: "7" },
    { ...fixture(), days: 30 },
    { ...fixture(), timeZone: "UTC" },
    { ...fixture(), summary: [] },
    { ...fixture(), daily: {} },
  ])
    rejects(value);
  rejects(fixture(7), 30);
  rejects({ ...fixture(7), days: 14 }, 14);
});

test("invalid, ambiguous and overflow calendar timestamps are rejected generically", () => {
  for (const asOf of [
    "2026",
    "2026-10-27",
    "2026-10-27T12:00:00",
    "2026-02-30T12:00:00Z",
    "2026-10-27T24:00:00Z",
    "2026-10-27T12:60:00Z",
    "2026-10-27T12:00:60Z",
    "2026-10-27T12:00:00+24:00",
    "2026-10-27T12:00:00+05:99",
    "2026-10-27T12:00:00.123456789Z",
    "x".repeat(100),
    null,
    123,
  ])
    rejects({ ...fixture(), asOf });
});

test("from and through must be real ISO dates matching the exact inclusive period", () => {
  for (const [field, replacement] of [
    ["from", "2026-10-20"],
    ["from", "2026-10-22"],
    ["through", "2026-10-28"],
    ["through", "2026-10-26"],
    ["from", "2026-2-3"],
    ["from", "2026-02-30"],
    ["through", "2026-13-01"],
    ["from", "2026-10-21T00:00:00Z"],
    ["from", null],
  ])
    rejects({ ...fixture(), [field]: replacement });
});

test("daily rows must include every day exactly once, ascending, with explicit zero rows", () => {
  const missing = fixture();
  missing.daily.splice(2, 1);
  rejects(missing);
  const extra = fixture();
  extra.daily.push({ ...extra.daily[0] });
  rejects(extra);
  const duplicate = fixture();
  duplicate.daily[3] = { ...duplicate.daily[2] };
  rejects(duplicate);
  const reverse = fixture();
  reverse.daily.reverse();
  rejects(reverse);
  const badDate = fixture();
  badDate.daily[0].date = "2026-02-30";
  rejects(badDate);
  const nonObject = fixture();
  nonObject.daily[0] = null;
  rejects(nonObject);
});

test("all summary and series counts must be bounded nonnegative safe integers", () => {
  for (const invalid of [
    -1,
    0.5,
    1_000_000_001,
    Number.MAX_SAFE_INTEGER + 1,
    Infinity,
    NaN,
    "3",
    null,
    false,
    undefined,
  ]) {
    for (const field of ["pageViews", "visitorDays", "recentVisitors", "leads"]) {
      const value = fixture();
      value.summary[field] = invalid;
      rejects(value);
    }
    for (const field of ["pageViews", "visitorDays", "leads"]) {
      const value = fixture();
      value.daily[0][field] = invalid;
      rejects(value);
    }
    for (const key of ["pages", "sources", "devices"]) {
      const value = fixture();
      value[key][0].pageViews = invalid;
      rejects(value);
    }
  }
});

test("visitor estimates and recent visitors cannot exceed their corresponding view totals", () => {
  const summary = fixture();
  summary.summary.visitorDays = 4;
  rejects(summary);
  const daily = fixture();
  daily.daily[0].visitorDays = 1;
  rejects(daily);
  const recent = fixture();
  recent.summary.recentVisitors = 3;
  rejects(recent);
});

test("summary page views, visitor days and leads must equal daily sums independently", () => {
  for (const field of ["pageViews", "visitorDays", "leads"]) {
    const value = fixture();
    value.daily[0][field] += 1;
    if (field === "visitorDays") value.daily[0].pageViews = 1;
    rejects(value);
  }
  const preTrackingLeads = fixture();
  assert.ok(trafficReport(preTrackingLeads, 7).summary.leads > preTrackingLeads.summary.pageViews);
});

test("each dimension must contain every fixed allowed label exactly once", () => {
  for (const [key, label] of [
    ["pages", "page"],
    ["sources", "source"],
    ["devices", "device"],
  ]) {
    const missing = fixture();
    missing[key].pop();
    rejects(missing);
    const extra = fixture();
    extra[key].push({ ...extra[key][0] });
    rejects(extra);
    const duplicate = fixture();
    duplicate[key][1] = { ...duplicate[key][0] };
    rejects(duplicate);
    const unknown = fixture();
    unknown[key][0][label] = "private-secret-label";
    rejects(unknown);
    const noLabel = fixture();
    delete noLabel[key][0][label];
    rejects(noLabel);
    const rowArray = fixture();
    rowArray[key][0] = [];
    rejects(rowArray);
  }
  for (const page of [
    "/admin",
    "/reset-password",
    "/api/admin/leads",
    "/?email=private@example.test",
    "https://luxeinfra.in/",
    "/#access_token=private",
  ]) {
    const value = fixture();
    value.pages[0].page = page;
    rejects(value);
  }
});

test("every dimension's counters must sum to the same summary page-view total", () => {
  for (const key of ["pages", "sources", "devices"]) {
    const value = fixture();
    value[key][0].pageViews = 2;
    rejects(value);
    const value2 = fixture();
    value2[key][1].pageViews = 1;
    rejects(value2);
  }
  const reordered = fixture();
  for (const key of ["pages", "sources", "devices"]) reordered[key].reverse();
  assert.deepEqual(trafficReport(reordered, 7), reordered);
});

test("unknown provider properties and private raw metadata never leave the validator", () => {
  const clean = fixture();
  const value = structuredClone(clean);
  const privateData = {
    ip: "203.0.113.8",
    userAgent: "Private browser details",
    visitorHash: "ab".repeat(32),
    email: "private@example.test",
    name: "Private person",
    query: "?phone=123",
    key: "provider-secret",
  };
  Object.assign(value, privateData);
  Object.assign(value.summary, privateData);
  for (const key of ["daily", "pages", "sources", "devices"])
    for (const row of value[key]) Object.assign(row, privateData);
  const result = trafficReport(value, 7);
  assert.deepEqual(result, clean);
  const serialized = JSON.stringify(result);
  for (const secret of Object.values(privateData)) assert.ok(!serialized.includes(secret));
});

test("returned aggregate objects are detached and cannot mutate provider response data", () => {
  const value = fixture();
  const result = trafficReport(value, 7);
  assert.notEqual(result, value);
  for (const key of ["summary", "daily", "pages", "sources", "devices"])
    assert.notEqual(result[key], value[key]);
  result.summary.pageViews = 999;
  result.daily[0].leads = 999;
  result.pages[0].pageViews = 999;
  assert.equal(value.summary.pageViews, 3);
  assert.equal(value.daily[0].leads, 0);
  assert.equal(value.pages[0].pageViews, 3);
});
