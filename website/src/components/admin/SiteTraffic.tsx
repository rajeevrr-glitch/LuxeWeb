import { useEffect, useId, useState } from "react";
import {
  Activity,
  BarChart3,
  CircleAlert,
  Eye,
  FileText,
  Globe2,
  Inbox,
  LoaderCircle,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { InboxApiError, inboxDate, inboxError, inboxRequest } from "@/lib/inbox-client";
import type { TrafficReport } from "@/lib/traffic";

type TrafficDays = 7 | 30 | 90;
type TrafficResult = TrafficReport | { enabled: false };
type EnabledReport = Extract<TrafficReport, { enabled: true }>;

const count = (value: number) => value.toLocaleString("en-IN");

const pageNames: Record<string, string> = {
  "/": "Home",
  "/about": "The studio",
  "/callback": "Get a quote",
  "/contact": "Contact the studio",
  "/design-ideas": "Design ideas",
  "/estimate": "Plan my budget",
  "/how-it-works": "Our process",
  "/materials": "Materials",
  "/my-inspiration": "Saved inspiration",
  "/offers": "Offers",
  "/partner-with-us": "Partner with us",
  "/plan": "Plan my space",
  "/privacy": "Privacy",
  "/project-brief": "Project brief",
  "/projects": "Our work",
  "/reimagine": "Room studio",
  "/testimonials": "Client reviews",
};

function readable(value: string): string {
  return value.replaceAll(/[-_]+/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function trafficDate(value: string, includeYear = false): string {
  const date = new Date(`${value}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function sourceName(source: string): string {
  const labels: Record<string, string> = {
    direct: "Direct / unknown",
    unknown: "Direct / unknown",
    google: "Google",
    bing: "Bing",
    search: "Search engines",
    social: "Social networks",
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    whatsapp: "WhatsApp",
    linkedin: "LinkedIn",
    pinterest: "Pinterest",
    referral: "Other websites",
    other: "Other / unknown",
  };
  return labels[source] || readable(source);
}

function niceStep(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, value)));
  const fraction = value / magnitude;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * magnitude;
}

function DailyTrend({ data }: { data: EnabledReport }) {
  const gradientId = `lta-area-${useId().replaceAll(":", "")}`;
  const width = 780;
  const height = 250;
  const left = 50;
  const right = 18;
  const top = 18;
  const bottom = 40;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(1, ...data.daily.map((day) => day.pageViews));
  const step = niceStep(Math.ceil(maxValue / 4));
  const ceiling = step * 4;
  const points = data.daily.map((day, index) => ({
    x: left + (index / Math.max(1, data.daily.length - 1)) * chartWidth,
    y: top + chartHeight - (day.pageViews / ceiling) * chartHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `M ${left},${top + chartHeight} L ${points.map((point) => `${point.x},${point.y}`).join(" L ")} L ${points.at(-1)!.x},${top + chartHeight} Z`
    : "";
  const labelIndices = [
    ...new Set([0, Math.floor((data.daily.length - 1) / 2), data.daily.length - 1]),
  ];

  return (
    <section className="lta-card lta-trend" aria-labelledby="lta-trend-title">
      <div className="lta-card-heading">
        <div>
          <span className="li-eyebrow">THE DAILY PICTURE</span>
          <h2 id="lta-trend-title">Visits, one day at a time</h2>
        </div>
        <span className="lta-legend">
          <span /> Page views
        </span>
      </div>
      {data.summary.pageViews === 0 ? (
        <div className="lta-empty lta-trend-empty">
          <BarChart3 size={30} aria-hidden="true" />
          <h3>No page views recorded in this period.</h3>
          <p>
            New visits will appear here after collection is enabled. Earlier traffic cannot be
            recovered.
          </p>
        </div>
      ) : (
        <figure
          className="lta-chart"
          tabIndex={0}
          aria-label="Daily page-view chart. Scroll horizontally on smaller screens."
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-labelledby={`${gradientId}-title ${gradientId}-description`}
          >
            <title id={`${gradientId}-title`}>Daily page views</title>
            <desc id={`${gradientId}-description`}>
              {count(data.summary.pageViews)} page views from {trafficDate(data.from, true)} to{" "}
              {trafficDate(data.through, true)}. Exact daily counts are in the table below.
            </desc>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#315f94" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#315f94" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((index) => {
              const y = top + chartHeight - (index / 4) * chartHeight;
              return (
                <g key={index}>
                  <line x1={left} x2={width - right} y1={y} y2={y} className="lta-chart-rule" />
                  <text x={left - 12} y={y + 4} textAnchor="end" className="lta-chart-label">
                    {count(step * index)}
                  </text>
                </g>
              );
            })}
            <path d={area} fill={`url(#${gradientId})`} />
            <polyline points={line} className="lta-chart-line" />
            {points.length <= 7 &&
              points.map((point, index) => (
                <circle
                  key={data.daily[index].date}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  className="lta-chart-point"
                />
              ))}
            {labelIndices.map(
              (index) =>
                data.daily[index] && (
                  <text
                    key={index}
                    x={points[index].x}
                    y={height - 12}
                    textAnchor={
                      index === 0 ? "start" : index === data.daily.length - 1 ? "end" : "middle"
                    }
                    className="lta-chart-label"
                  >
                    {trafficDate(data.daily[index].date)}
                  </text>
                ),
            )}
          </svg>
          <figcaption>Page views per day · Indian Standard Time (IST)</figcaption>
        </figure>
      )}
      <details className="lta-daily-details">
        <summary>View daily numbers</summary>
        <div
          className="lta-table-scroll lta-daily-scroll"
          tabIndex={0}
          role="region"
          aria-label="Daily traffic counts"
        >
          <table className="lta-table">
            <caption className="li-sr-only">
              Daily page views, estimated visitors and saved enquiries in IST
            </caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Page views</th>
                <th scope="col">Visitor days</th>
                <th scope="col">Saved enquiries</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((day) => (
                <tr key={day.date}>
                  <th scope="row">
                    <time dateTime={day.date}>{trafficDate(day.date, true)}</time>
                  </th>
                  <td>{count(day.pageViews)}</td>
                  <td>{count(day.visitorDays)}</td>
                  <td>{count(day.leads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function Breakdown({
  title,
  eyebrow,
  items,
  icon: Icon,
  emptyText,
}: {
  title: string;
  eyebrow: string;
  items: { label: string; value: number }[];
  icon: typeof Globe2;
  emptyText: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="lta-card lta-breakdown" aria-label={title}>
      <div className="lta-card-heading">
        <div>
          <span className="li-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <Icon size={22} aria-hidden="true" />
      </div>
      {total === 0 ? (
        <p className="lta-breakdown-empty">{emptyText}</p>
      ) : (
        <ul className="lta-bars">
          {items
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((item) => (
              <li key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>
                    {count(item.value)} <small>views</small>
                  </strong>
                </div>
                <span className="lta-bar-track" aria-hidden="true">
                  <span style={{ width: `${(item.value / total) * 100}%` }} />
                </span>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

export function SiteTraffic({ handleError }: { handleError: (error: unknown) => boolean }) {
  const [days, setDays] = useState<TrafficDays>(7);
  const [snapshot, setSnapshot] = useState<{ days: TrafficDays; data: TrafficResult } | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const current = snapshot?.days === days ? snapshot.data : null;
  const data = current?.enabled ? current : null;

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    inboxRequest<TrafficResult>(`/traffic?days=${days}`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setSnapshot({ days, data: result });
      })
      .catch((cause) => {
        if (!controller.signal.aborted && !handleError(cause))
          setError(
            cause instanceof InboxApiError && cause.status === 503
              ? "Traffic reporting is temporarily unavailable. Please try again shortly."
              : inboxError(cause, "We couldn’t load site traffic. Please refresh to try again."),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [days, revision, handleError]);

  const metrics = data
    ? [
        {
          label: "Page views",
          value: data.summary.pageViews,
          icon: Eye,
          note: "Recorded page openings, including repeat visits",
        },
        {
          label: "Visitor days",
          value: data.summary.visitorDays,
          icon: Users,
          note: "Daily visitor estimates added together",
        },
        {
          label: "Recent visitors",
          value: data.summary.recentVisitors,
          icon: Activity,
          note: "Approximate activity in the last 15 minutes",
        },
        {
          label: "Saved enquiries",
          value: data.summary.leads,
          icon: Inbox,
          note: "Enquiries saved in the selected period",
        },
      ]
    : [];
  const viewedPages =
    data?.pages
      .filter((page) => page.pageViews > 0)
      .sort((a, b) => b.pageViews - a.pageViews || a.page.localeCompare(b.page)) || [];

  return (
    <section className="lta-workspace" aria-labelledby="lta-title" aria-busy={busy}>
      <div className="li-page-heading">
        <div>
          <span className="li-eyebrow">OWNER · SITE TRAFFIC</span>
          <h1 id="lta-title">
            See what brings people in<span className="li-heading-dot">.</span>
          </h1>
          <p>A private view of website visits, popular pages and saved enquiries.</p>
        </div>
        <button
          type="button"
          className="li-button li-button-light"
          disabled={busy}
          onClick={() => setRevision((value) => value + 1)}
        >
          <RefreshCw size={16} className={busy ? "li-spin" : ""} aria-hidden="true" />
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="lta-toolbar">
        <div className="lta-ranges" role="group" aria-label="Traffic reporting period">
          {([7, 30, 90] as const).map((period) => (
            <button
              type="button"
              key={period}
              aria-pressed={days === period}
              onClick={() => setDays(period)}
            >
              Last {period} days
            </button>
          ))}
        </div>
        <p className="lta-updated" role="status">
          {busy ? (
            data ? (
              "Refreshing · previous snapshot shown"
            ) : (
              "Loading traffic…"
            )
          ) : data ? (
            <>
              Updated <time dateTime={data.asOf}>{inboxDate(data.asOf)}</time> · IST
            </>
          ) : (
            ""
          )}
        </p>
      </div>

      {error && (
        <div className="li-notice li-notice-danger" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <div>
            {error}
            {data &&
              " The numbers below are from the last successful refresh and may be out of date."}
          </div>
        </div>
      )}

      {busy && !current && (
        <div className="lta-card lta-empty" role="status">
          <LoaderCircle size={28} className="li-spin" aria-hidden="true" />
          <h2>Gathering the picture…</h2>
          <p>Loading the recorded activity for this period.</p>
        </div>
      )}

      {current?.enabled === false && (
        <div className="lta-card lta-empty lta-disabled">
          <ShieldCheck size={32} aria-hidden="true" />
          <span className="li-eyebrow">TRAFFIC COLLECTION IS OFF</span>
          <h2>Ready when the connection is.</h2>
          <p>
            Visitor tracking is not enabled for this website yet. There are no traffic numbers to
            show. Your lead inbox continues to work separately.
          </p>
          <p className="lta-small-note">
            Enable the private traffic service in the hosting setup to begin collecting new visits.
            Earlier traffic cannot be recovered.
          </p>
        </div>
      )}

      {data && (
        <>
          <div className="lta-period-heading">
            <span className="lta-recording">
              <span aria-hidden="true" /> Traffic collection enabled
            </span>
            <p>
              {trafficDate(data.from, true)} — {trafficDate(data.through, true)}{" "}
              <span>· IST calendar days, including today</span>
            </p>
          </div>
          <div className="lta-metrics">
            {metrics.map((metric) => (
              <div className="lta-metric" key={metric.label}>
                <span className="lta-metric-icon">
                  <metric.icon size={20} aria-hidden="true" />
                </span>
                <span>{metric.label}</span>
                <strong>{count(metric.value)}</strong>
                <p>{metric.note}</p>
              </div>
            ))}
          </div>
          <DailyTrend data={data} />
          <div className="lta-insights-grid">
            <section className="lta-card lta-pages" aria-labelledby="lta-pages-title">
              <div className="lta-card-heading">
                <div>
                  <span className="li-eyebrow">WHAT CAUGHT THEIR EYE</span>
                  <h2 id="lta-pages-title">Most viewed pages</h2>
                </div>
                <FileText size={22} aria-hidden="true" />
              </div>
              {viewedPages.length === 0 ? (
                <p className="lta-breakdown-empty">
                  Popular pages will appear after visits are recorded.
                </p>
              ) : (
                <div className="lta-table-scroll">
                  <table className="lta-table">
                    <caption className="li-sr-only">Pages ranked by recorded page views</caption>
                    <thead>
                      <tr>
                        <th scope="col">Page</th>
                        <th scope="col">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewedPages.slice(0, 10).map((page) => (
                        <tr key={page.page}>
                          <th scope="row">
                            <strong>
                              {pageNames[page.page] ||
                                readable(page.page.split("/").filter(Boolean).join(" / "))}
                            </strong>
                            <span className="lta-page-path">{page.page}</span>
                          </th>
                          <td>{count(page.pageViews)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {viewedPages.length > 10 && (
                <p className="lta-card-footnote">Showing the 10 most viewed pages.</p>
              )}
            </section>
            <div className="lta-side-insights">
              <Breakdown
                title="Where visits came from"
                eyebrow="REFERRING SOURCES"
                icon={Globe2}
                items={data.sources.map((source) => ({
                  label: sourceName(source.source),
                  value: source.pageViews,
                }))}
                emptyText="Sources will appear when visits are recorded."
              />
              <Breakdown
                title="How people browsed"
                eyebrow="DEVICE MIX"
                icon={MonitorSmartphone}
                items={data.devices.map((device) => ({
                  label: readable(device.device),
                  value: device.pageViews,
                }))}
                emptyText="Device activity will appear when visits are recorded."
              />
            </div>
          </div>
        </>
      )}

      <aside className="lta-privacy-note" aria-labelledby="lta-privacy-title">
        <ShieldCheck size={21} aria-hidden="true" />
        <div>
          <h2 id="lta-privacy-title">Useful signals. A lighter footprint.</h2>
          <p>
            Traffic is measured without tracking cookies. Do Not Track and the visitor’s
            traffic-measurement opt-out are respected. Counts are approximate and can miss visits
            when browsers block collection.
          </p>
          <p>
            “Visitor days” adds daily estimates: the same person returning on another day counts
            again. Recent visitors are approximate, including a possible double count around
            midnight. Saved enquiries are period totals, not attributed conversions or confirmed
            sales. Traffic from before collection was enabled is unavailable.
          </p>
          <p>
            To leave your own public-site browsing out, open the{" "}
            <a href="/privacy#site-statistics" target="_blank" rel="noopener noreferrer">
              site privacy settings
            </a>
            .
          </p>
        </div>
      </aside>
    </section>
  );
}
