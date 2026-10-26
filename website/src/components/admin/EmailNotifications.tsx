import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { inboxDate, inboxError, inboxRequest } from "@/lib/inbox-client";

type EmailState =
  | "pending"
  | "leased"
  | "retry"
  | "accepted"
  | "failed"
  | "needs_review"
  | "expired";

interface EmailEvent {
  id: string;
  reference: string;
  state: EmailState;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  nextAttemptAt: string | null;
  lastErrorCode: string | null;
  providerId: string | null;
}

interface NotificationOverview {
  configuration: {
    enabled: boolean;
    ready: boolean;
    provider: "resend";
    sender: string | null;
    recipients: string[];
  };
  summary: {
    pending: number;
    retrying: number;
    accepted: number;
    failed: number;
    needsReview: number;
    expired: number;
  };
  items: EmailEvent[];
}

const stateLabels: Record<EmailState, string> = {
  pending: "Queued",
  leased: "Processing",
  retry: "Retry scheduled",
  accepted: "Email accepted",
  failed: "Failed",
  needs_review: "Needs review",
  expired: "Expired",
};

function EventStatus({ item }: { item: EmailEvent }) {
  return (
    <>
      <span className={`li-email-state li-email-state-${item.state}`}>
        {stateLabels[item.state] || "Status unavailable"}
      </span>
      {item.state === "needs_review" && (
        <span className="li-email-event-note">Check Resend before sending manually.</span>
      )}
      {item.state === "retry" && item.nextAttemptAt && (
        <span className="li-email-event-note">Next attempt: {inboxDate(item.nextAttemptAt)}</span>
      )}
      {item.state === "failed" && (
        <span className="li-email-event-note">Check the sending configuration in Resend.</span>
      )}
      {item.state === "expired" && (
        <span className="li-email-event-note">The automatic sending window has ended.</span>
      )}
    </>
  );
}

export function EmailNotifications({ handleError }: { handleError: (error: unknown) => boolean }) {
  const [data, setData] = useState<NotificationOverview | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    inboxRequest<NotificationOverview>("/notifications", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && !handleError(cause))
          setError(
            inboxError(cause, "We couldn’t load email activity. Please refresh to try again."),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [revision, handleError]);

  const attention = data
    ? data.summary.failed + data.summary.needsReview + data.summary.expired
    : 0;
  const config = data?.configuration;

  return (
    <section className="li-email-workspace" aria-labelledby="li-email-title" aria-busy={busy}>
      <div className="li-page-heading">
        <div>
          <span className="li-eyebrow">OWNER · EMAIL ALERTS</span>
          <h1 id="li-email-title">
            Keep the conversation moving<span className="li-heading-dot">.</span>
          </h1>
          <p>Sending activity for new-enquiry alerts to the LuxeInfra team.</p>
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

      {error && (
        <div className="li-notice li-notice-danger" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <div>
            {error} {data && "The activity below is from the last successful refresh."}
          </div>
        </div>
      )}

      {busy && !data && (
        <div className="li-email-empty" role="status">
          <LoaderCircle size={26} className="li-spin" aria-hidden="true" />
          <p>Loading your email activity…</p>
        </div>
      )}

      {data && config && (
        <>
          <section
            className={`li-email-connection${config.enabled && config.ready ? " li-email-connection-ready" : ""}`}
            aria-labelledby="li-email-connection-title"
          >
            <span className="li-email-connection-icon">
              {config.enabled && config.ready ? (
                <ShieldCheck size={24} aria-hidden="true" />
              ) : (
                <Mail size={24} aria-hidden="true" />
              )}
            </span>
            <div className="li-email-connection-copy">
              <span className="li-eyebrow">RESEND CONNECTION</span>
              <h2 id="li-email-connection-title">
                {!config.enabled
                  ? "Email alerts are switched off."
                  : config.ready
                    ? "Email alerts are enabled."
                    : "Finish the email setup."}
              </h2>
              <p>
                {!config.enabled
                  ? "Enquiries still save in your lead inbox. No email alerts are being sent."
                  : config.ready
                    ? "New-enquiry alerts can be processed with the configured sender and recipients below."
                    : "The sending settings are incomplete. Enquiries still save in your lead inbox while email alerts are unavailable."}
              </p>
            </div>
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener noreferrer"
              className="li-button li-button-light li-button-small"
            >
              Open Resend <ExternalLink size={14} aria-hidden="true" />
            </a>
          </section>

          <div className="li-email-metrics">
            <div className="li-email-metric">
              <span className="li-email-metric-icon">
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <span>Waiting to send</span>
              <strong>
                {(data.summary.pending + data.summary.retrying).toLocaleString("en-IN")}
              </strong>
              <p>
                {data.summary.pending.toLocaleString("en-IN")} queued ·{" "}
                {data.summary.retrying.toLocaleString("en-IN")} retrying
              </p>
            </div>
            <div className="li-email-metric">
              <span className="li-email-metric-icon li-email-metric-success">
                <CheckCircle2 size={20} aria-hidden="true" />
              </span>
              <span>Email accepted</span>
              <strong>{data.summary.accepted.toLocaleString("en-IN")}</strong>
              <p>Accepted by Resend for sending</p>
            </div>
            <div className={`li-email-metric${attention ? " li-email-metric-attention" : ""}`}>
              <span className="li-email-metric-icon">
                <CircleAlert size={20} aria-hidden="true" />
              </span>
              <span>Needs attention</span>
              <strong>{attention.toLocaleString("en-IN")}</strong>
              <p>
                {data.summary.needsReview.toLocaleString("en-IN")} to review ·{" "}
                {data.summary.failed.toLocaleString("en-IN")} failed ·{" "}
                {data.summary.expired.toLocaleString("en-IN")} expired
              </p>
            </div>
          </div>

          {data.summary.needsReview > 0 && (
            <div className="li-email-review-notice" role="status">
              <CircleAlert size={20} aria-hidden="true" />
              <div>
                <strong>Check uncertain attempts before sending again.</strong>
                <p>
                  A “Needs review” alert may already have reached Resend. Check its activity in the
                  Resend dashboard before any manual send to avoid duplicate emails.
                </p>
              </div>
            </div>
          )}

          <section className="li-email-activity" aria-labelledby="li-email-activity-title">
            <div className="li-email-activity-heading">
              <div>
                <span className="li-eyebrow">SENDING HISTORY</span>
                <h2 id="li-email-activity-title">Recent email activity</h2>
              </div>
              <span>Latest 50 alerts · times in IST</span>
            </div>
            <p className="li-email-acceptance-note">
              “Email accepted” confirms Resend accepted the request. It does not confirm that a
              recipient received or read the email.
            </p>

            {data.items.length === 0 ? (
              <div className="li-email-empty">
                <Mail size={28} aria-hidden="true" />
                <h3>No email activity yet.</h3>
                <p>New-enquiry alerts will appear here when they enter the email queue.</p>
              </div>
            ) : (
              <>
                <div className="li-email-table-wrap">
                  <table className="li-email-table">
                    <caption className="li-sr-only">Recent enquiry email alerts</caption>
                    <thead>
                      <tr>
                        <th scope="col">Enquiry reference</th>
                        <th scope="col">Status</th>
                        <th scope="col">Attempts</th>
                        <th scope="col">Last update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{item.reference}</th>
                          <td>
                            <EventStatus item={item} />
                          </td>
                          <td>{item.attempts}</td>
                          <td>
                            <time dateTime={item.updatedAt}>{inboxDate(item.updatedAt)}</time>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ol className="li-email-mobile-list" aria-label="Recent enquiry email alerts">
                  {data.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.reference}</strong>
                      <div>
                        <EventStatus item={item} />
                      </div>
                      <div className="li-email-mobile-meta">
                        <span>
                          {item.attempts} {item.attempts === 1 ? "attempt" : "attempts"}
                        </span>
                        <time dateTime={item.updatedAt}>{inboxDate(item.updatedAt)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>

          <section className="li-email-settings" aria-labelledby="li-email-settings-title">
            <div>
              <span className="li-eyebrow">BUSINESS EMAIL SETTINGS</span>
              <h2 id="li-email-settings-title">Your alert connection</h2>
              <p>
                Set up a Resend account, verify the sending domain and add its private API key in
                the hosting settings. Keep keys out of this workspace.
              </p>
            </div>
            <dl>
              <div>
                <dt>Sender</dt>
                <dd>{config.sender || "Not configured"}</dd>
              </div>
              <div>
                <dt>Team recipients</dt>
                <dd>
                  {config.recipients.length ? (
                    config.recipients.map((recipient) => <span key={recipient}>{recipient}</span>)
                  ) : (
                    <span>Not configured</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>
          <p className="li-email-scope-note">
            These alerts go to your team. Customer confirmation emails and WhatsApp notifications
            are separate and are not enabled by this connection.
          </p>
        </>
      )}
    </section>
  );
}
