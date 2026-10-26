import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { EmailNotifications } from "@/components/admin/EmailNotifications";
import {
  InboxApiError,
  inboxDate,
  inboxError,
  inboxRequest,
  leadKindLabels,
  leadStatuses,
  localDateTime,
} from "@/lib/inbox-client";
import type {
  InboxSession,
  InboxSummary,
  InboxUser,
  Lead,
  LeadList,
  LeadStatus,
  TeamAccess,
  TeamMember,
} from "@/lib/inbox-client";
import inboxCss from "@/styles/admin.css?url";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Private workspace — LuxeInfra" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
    links: [{ rel: "stylesheet", href: inboxCss }],
  }),
  component: AdminWorkspace,
});

type WorkspaceTab = "inbox" | "overview" | "team" | "notifications";
type HandleError = (error: unknown) => boolean;

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`li-brand${light ? " li-brand-light" : ""}`}>
      <strong>
        LUXE<span>INFRA</span>
      </strong>
      <span className="li-brand-caption">STUDIO WORKSPACE</span>
    </div>
  );
}

function Notice({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className={`li-notice${danger ? " li-notice-danger" : ""}`}
      role={danger ? "alert" : "status"}
    >
      <CircleAlert size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

function AdminWorkspace() {
  const [session, setSession] = useState<InboxSession | null>(null);
  const [bootError, setBootError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [tab, setTab] = useState<WorkspaceTab>("inbox");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutUnconfirmed, setLogoutUnconfirmed] = useState(false);
  const requestGeneration = useRef(0);
  const pendingCsrf = useRef("");
  const detailDirty = useRef(false);
  const reportDirty = useCallback((dirty: boolean) => {
    detailDirty.current = dirty;
  }, []);

  function confirmDiscard() {
    if (detailDirty.current && !window.confirm("Discard your unsaved enquiry changes?"))
      return false;
    detailDirty.current = false;
    return true;
  }

  function changeTab(next: WorkspaceTab) {
    if (next === tab || !confirmDiscard()) return;
    setTab(next);
  }

  const loadSession = useCallback(async () => {
    setBootError("");
    const generation = ++requestGeneration.current;
    try {
      const result = await inboxRequest<InboxSession>("/session");
      if (generation === requestGeneration.current) setSession(result);
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      if (error instanceof InboxApiError && (error.status === 401 || error.status === 403)) {
        setSession({ enabled: true, authenticated: false });
        setSessionMessage("Your session has ended. Sign in again to continue.");
      } else setBootError("We couldn’t connect to the private workspace. Please try again.");
    }
  }, []);

  useEffect(() => {
    void loadSession();
    return () => {
      requestGeneration.current += 1;
      detailDirty.current = false;
    };
  }, [loadSession]);

  const handleError: HandleError = useCallback((error) => {
    if (error instanceof InboxApiError && (error.status === 401 || error.status === 403)) {
      requestGeneration.current += 1;
      setSession({ enabled: true, authenticated: false });
      setTab("inbox");
      setSessionMessage(
        "Your session has ended or your access changed. Sign in again to continue.",
      );
      return true;
    }
    return false;
  }, []);

  async function logout() {
    const csrfToken = session?.csrfToken || pendingCsrf.current;
    pendingCsrf.current = csrfToken;
    requestGeneration.current += 1;
    detailDirty.current = false;
    setSession({ enabled: true, authenticated: false });
    setTab("inbox");
    setLoggingOut(true);
    setLogoutUnconfirmed(false);
    setSessionMessage("");
    try {
      await inboxRequest("/logout", { method: "POST", body: {}, csrfToken });
      pendingCsrf.current = "";
      setSessionMessage(
        "You’ve signed out. Private enquiry details have been cleared from this screen.",
      );
    } catch {
      setLogoutUnconfirmed(true);
      setSessionMessage(
        "Private details have been cleared from this screen, but we couldn’t confirm sign-out with the server. Retry sign-out before leaving this shared device.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const authenticated = session?.authenticated && session.user && session.csrfToken;
  if (!authenticated) {
    return (
      <div className="li-admin li-login-shell">
        <aside className="li-login-story">
          <Brand light />
          <div className="li-story-copy">
            <span className="li-eyebrow">THE BUSINESS BEHIND THE BEAUTIFUL</span>
            <h1>
              Every enquiry.
              <br />A new beginning.
            </h1>
            <p>
              A quiet place to keep your conversations, next steps and future projects together.
            </p>
          </div>
          <p className="li-story-footer">
            <ShieldCheck size={17} aria-hidden="true" /> Private access for the LuxeInfra team
          </p>
        </aside>
        <main className="li-login-main">
          <div className="li-login-card">
            <span className="li-lock-mark">
              <LockKeyhole size={24} aria-hidden="true" />
            </span>
            <span className="li-eyebrow">WELCOME BACK</span>
            <h2>Your studio, organised.</h2>
            <p className="li-muted">Sign in to the private lead inbox.</p>
            {sessionMessage && <Notice danger={logoutUnconfirmed}>{sessionMessage}</Notice>}
            {loggingOut ? (
              <p className="li-loading">
                <LoaderCircle className="li-spin" size={18} /> Signing out securely…
              </p>
            ) : logoutUnconfirmed ? (
              <button className="li-button li-button-primary" onClick={() => void logout()}>
                Retry sign-out
              </button>
            ) : bootError ? (
              <>
                <Notice danger>{bootError}</Notice>
                <button className="li-button li-button-primary" onClick={() => void loadSession()}>
                  Retry connection
                </button>
              </>
            ) : session === null ? (
              <p className="li-loading" role="status">
                <LoaderCircle className="li-spin" size={20} /> Opening your workspace…
              </p>
            ) : !session.enabled ? (
              <Notice>
                Inbox setup is not complete. Your public site continues to collect enquiries. The
                owner can finish the secure setup in Supabase and the hosting settings.
              </Notice>
            ) : (
              <LoginForm
                onLogin={(result) => {
                  requestGeneration.current += 1;
                  setSession(result);
                  setSessionMessage("");
                }}
              />
            )}
            <p className="li-login-note">
              <LockKeyhole size={14} aria-hidden="true" /> Approved accounts only. There is no
              public sign-up.
            </p>
            <a className="li-back-site" href="/">
              Back to LuxeInfra website
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="li-admin li-workspace">
      <aside className="li-sidebar">
        <Brand light />
        <div className="li-side-label">WORKSPACE</div>
        <nav aria-label="Private workspace">
          <button
            className={tab === "inbox" ? "is-active" : ""}
            aria-current={tab === "inbox" ? "page" : undefined}
            onClick={() => changeTab("inbox")}
          >
            <Inbox size={19} /> Lead inbox
          </button>
          {session.user!.role === "owner" && (
            <>
              <div className="li-side-label li-owner-label">OWNER CONTROLS</div>
              <button
                className={tab === "overview" ? "is-active" : ""}
                aria-current={tab === "overview" ? "page" : undefined}
                onClick={() => changeTab("overview")}
              >
                <LayoutDashboard size={19} /> Overview
              </button>
              <button
                className={tab === "team" ? "is-active" : ""}
                aria-current={tab === "team" ? "page" : undefined}
                onClick={() => changeTab("team")}
              >
                <Users size={19} /> Team access
              </button>
              <button
                className={tab === "notifications" ? "is-active" : ""}
                aria-current={tab === "notifications" ? "page" : undefined}
                onClick={() => changeTab("notifications")}
              >
                <Mail size={19} /> Email alerts
              </button>
            </>
          )}
        </nav>
        <div className="li-side-bottom">
          <ShieldCheck size={20} />
          <p>
            Built for your team.
            <br />
            <span>Keep customer details private.</span>
          </p>
        </div>
      </aside>
      <div className="li-main-shell">
        <header className="li-topbar">
          <div className="li-private-label">
            <LockKeyhole size={14} /> PRIVATE WORKSPACE
          </div>
          <div className="li-user-group">
            <span className="li-user-avatar">
              {(session.user!.displayName || session.user!.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="li-user-copy">
              <strong>{session.user!.displayName || session.user!.email}</strong>
              <span>{session.user!.role === "owner" ? "Owner" : "Team member"}</span>
            </div>
            <button
              className="li-icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                if (confirmDiscard()) void logout();
              }}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main className="li-main" id="admin-main">
          {tab === "inbox" ? (
            <LeadInbox
              csrfToken={session.csrfToken!}
              handleError={handleError}
              onDirtyChange={reportDirty}
            />
          ) : tab === "overview" && session.user!.role === "owner" ? (
            <OwnerOverview handleError={handleError} onOpenInbox={() => changeTab("inbox")} />
          ) : tab === "notifications" && session.user!.role === "owner" ? (
            <EmailNotifications handleError={handleError} />
          ) : tab === "team" && session.user!.role === "owner" ? (
            <TeamPanel
              user={session.user!}
              csrfToken={session.csrfToken!}
              handleError={handleError}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (session: InboxSession) => void }) {
  const [email, setEmail] = useState("sales@luxeinfra.in");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await inboxRequest<InboxSession>("/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      setPassword("");
      if (!result.authenticated || !result.user || !result.csrfToken)
        throw new Error("Sign in unsuccessful");
      onLogin(result);
    } catch (cause) {
      setPassword("");
      setError(
        inboxError(
          cause,
          "We couldn’t sign you in. Check your email, password and approved team access, then try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="li-login-form" onSubmit={(event) => void submit(event)}>
      <label htmlFor="inbox-email">Work email</label>
      <input
        id="inbox-email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        maxLength={254}
        disabled={busy}
      />
      <label htmlFor="inbox-password">Password</label>
      <div className="li-password-field">
        <input
          id="inbox-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          maxLength={256}
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-pressed={showPassword}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {error && <Notice danger>{error}</Notice>}
      <button className="li-button li-button-primary" type="submit" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="li-spin" size={18} /> Signing in…
          </>
        ) : (
          <>
            Open lead inbox <LockKeyhole size={16} />
          </>
        )}
      </button>
      <p className="li-form-help">
        Need access or a password reset? Contact your LuxeInfra workspace owner.
      </p>
    </form>
  );
}

function LeadInbox({
  csrfToken,
  handleError,
  onDirtyChange,
}: {
  csrfToken: string;
  handleError: HandleError;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [result, setResult] = useState<LeadList | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [revision, setRevision] = useState(0);
  const dirtyEditing = useRef(false);
  const reportDirty = useCallback(
    (dirty: boolean) => {
      dirtyEditing.current = dirty;
      onDirtyChange(dirty);
    },
    [onDirtyChange],
  );
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  function selectLead(next: Lead | null) {
    if (next?.id === selected?.id) return;
    if (dirtyEditing.current && !window.confirm("Discard your unsaved enquiry changes?")) return;
    reportDirty(false);
    setSelected(next);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    const query = new URLSearchParams({ page: String(page) });
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (status) query.set("status", status);
    if (kind) query.set("kind", kind);
    inboxRequest<LeadList>(`/leads?${query}`, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult(data);
        setRefreshedAt(new Date().toISOString());
      })
      .catch((cause) => {
        if (!controller.signal.aborted && !handleError(cause))
          setError(
            inboxError(
              cause,
              "We couldn’t load the enquiries. Your saved leads have not changed. Please retry.",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [debouncedSearch, status, kind, page, revision, handleError]);

  function saved(item: Lead) {
    setSelected(item);
    setRevision((value) => value + 1);
  }

  return (
    <>
      <div className="li-page-heading">
        <div>
          <span className="li-eyebrow">CONVERSATIONS INTO PROJECTS</span>
          <h1>
            Lead inbox<span className="li-heading-dot">.</span>
          </h1>
          <p>Every new space starts with a conversation. Keep yours moving.</p>
        </div>
        <button
          className="li-button li-button-light"
          onClick={() => setRevision((value) => value + 1)}
          disabled={busy}
        >
          <RefreshCw size={16} className={busy ? "li-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="li-inbox-meta">
        <span className="li-new-count">
          <span />{" "}
          {result
            ? `${result.summary.new} new ${result.summary.new === 1 ? "enquiry" : "enquiries"}`
            : "Your enquiry inbox"}
        </span>
        <span>
          {refreshedAt
            ? `Updated ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(refreshedAt))} IST`
            : "All times displayed in IST"}
        </span>
      </div>
      <div className={`li-inbox-grid${selected ? " li-has-selection" : ""}`}>
        <section className="li-inbox-list-panel" aria-label="Enquiries">
          <div className="li-filter-bar">
            <div className="li-search-field">
              <Search size={18} aria-hidden="true" />
              <label className="li-sr-only" htmlFor="lead-search">
                Search enquiries
              </label>
              <input
                id="lead-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone or reference"
                maxLength={100}
              />
            </div>
            <div className="li-filter-selects">
              <label className="li-sr-only" htmlFor="lead-status-filter">
                Filter by status
              </label>
              <select
                id="lead-status-filter"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {leadStatuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <label className="li-sr-only" htmlFor="lead-kind-filter">
                Filter by enquiry type
              </label>
              <select
                id="lead-kind-filter"
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All enquiries</option>
                {Object.entries(leadKindLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <div className="li-panel-notice">
              <Notice danger>{error}</Notice>
            </div>
          )}
          <div className="li-list-caption">
            <span>
              {result
                ? `${result.total} ${result.total === 1 ? "enquiry" : "enquiries"}`
                : "Enquiries"}
              {status || kind || debouncedSearch ? " matching your filters" : " received"}
            </span>
            <span>RECENT FIRST</span>
          </div>
          {busy && !result ? (
            <div className="li-empty" role="status">
              <LoaderCircle className="li-spin" size={26} />
              <h2>Opening the inbox</h2>
              <p>Loading your latest enquiries securely.</p>
            </div>
          ) : !result?.items.length ? (
            <div className="li-empty">
              <Inbox size={34} />
              <h2>
                {debouncedSearch || status || kind
                  ? "No matching enquiries"
                  : "Room for new beginnings"}
              </h2>
              <p>
                {debouncedSearch || status || kind
                  ? "Try another search or clear your filters."
                  : "New website enquiries will appear here once they’re saved."}
              </p>
              {(debouncedSearch || status || kind) && (
                <button
                  className="li-button li-button-light"
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                    setStatus("");
                    setKind("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className={`li-lead-list${busy ? " li-is-loading" : ""}`} aria-busy={busy}>
              {result.items.map((lead) => (
                <button
                  key={lead.id}
                  className={`li-lead-row${selected?.id === lead.id ? " is-selected" : ""}`}
                  onClick={() => selectLead(lead)}
                  aria-pressed={selected?.id === lead.id}
                >
                  <span className="li-lead-row-top">
                    <strong>{lead.name}</strong>
                    <StatusBadge status={lead.status} />
                  </span>
                  <span className="li-lead-row-location">
                    {lead.city} <span>·</span> {leadKindLabels[lead.kind] || "Enquiry"}
                  </span>
                  <span className="li-lead-row-message">{lead.message}</span>
                  <span className="li-lead-row-bottom">
                    <span>{lead.reference}</span>
                    <span>{inboxDate(lead.createdAt, false)}</span>
                  </span>
                  {lead.followUpAt && (
                    <span
                      className={`li-row-followup${new Date(lead.followUpAt).getTime() <= Date.now() && lead.status !== "closed" ? " is-due" : ""}`}
                    >
                      <CalendarClock size={13} /> Follow-up {inboxDate(lead.followUpAt)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="li-pagination">
            <span>
              {result && result.total > 0
                ? `${(result.page - 1) * result.pageSize + 1}–${Math.min(result.page * result.pageSize, result.total)} of ${result.total}`
                : "0 enquiries"}
            </span>
            <div>
              <button
                className="li-icon-button"
                aria-label="Previous page"
                disabled={busy || page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>Page {page}</span>
              <button
                className="li-icon-button"
                aria-label="Next page"
                disabled={busy || !result || page * result.pageSize >= result.total}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
        <section className="li-detail-panel" aria-label="Selected enquiry">
          {selected ? (
            <LeadDetail
              key={selected.id}
              lead={selected}
              csrfToken={csrfToken}
              handleError={handleError}
              onSaved={saved}
              onClose={() => selectLead(null)}
              onDirtyChange={reportDirty}
            />
          ) : (
            <div className="li-detail-placeholder">
              <span className="li-detail-symbol">
                <MessageCircle size={30} strokeWidth={1.4} />
              </span>
              <span className="li-eyebrow">THE NEXT CONVERSATION</span>
              <h2>
                A little attention.
                <br />A lasting impression.
              </h2>
              <p>
                Select an enquiry to see what a customer has in mind, add notes and plan your
                follow-up.
              </p>
              <span className="li-private-footnote">
                <LockKeyhole size={13} /> Visible only to approved team members
              </span>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`li-status li-status-${status}`}>
      <span />
      {leadStatuses.find((item) => item.value === status)?.label || status}
    </span>
  );
}

function LeadDetail({
  lead,
  csrfToken,
  handleError,
  onSaved,
  onClose,
  onDirtyChange,
}: {
  lead: Lead;
  csrfToken: string;
  handleError: HandleError;
  onSaved: (lead: Lead) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [baseline, setBaseline] = useState(lead);
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes || "");
  const [followUp, setFollowUp] = useState(localDateTime(lead.followUpAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflict, setConflict] = useState(false);
  const [reloadRequested, setReloadRequested] = useState(false);
  const alive = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (window.matchMedia("(max-width: 700px)").matches)
      heading.current?.scrollIntoView({ block: "start" });
  }, []);
  const dirty =
    status !== baseline.status ||
    notes !== (baseline.notes || "") ||
    followUp !== localDateTime(baseline.followUpAt);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    function preventNavigation(event: BeforeUnloadEvent) {
      if (dirty) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", preventNavigation);
    return () => window.removeEventListener("beforeunload", preventNavigation);
  }, [dirty]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const nextFollowUp = followUp ? new Date(followUp) : null;
      if (nextFollowUp && Number.isNaN(nextFollowUp.getTime())) {
        setError("Choose a valid follow-up date and time.");
        return;
      }
      const item = await inboxRequest<Lead>(`/leads/${encodeURIComponent(lead.id)}`, {
        method: "PATCH",
        csrfToken,
        body: {
          status,
          notes,
          followUpAt: nextFollowUp?.toISOString() || null,
          expectedUpdatedAt: baseline.updatedAt,
        },
      });
      if (!alive.current) return;
      setBaseline(item);
      setStatus(item.status);
      setNotes(item.notes || "");
      setFollowUp(localDateTime(item.followUpAt));
      setConflict(false);
      setSuccess("Enquiry updated. Your next steps are saved.");
      onSaved(item);
    } catch (cause) {
      if (!alive.current || handleError(cause)) return;
      if (cause instanceof InboxApiError && cause.status === 409) {
        setConflict(true);
        setError(
          "Another team member updated this enquiry. Your edits are still here. Copy anything you need, then load the latest version before saving.",
        );
      } else
        setError(
          inboxError(
            cause,
            "We couldn’t save these changes. Your edits are still here. Please try again.",
          ),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  async function reload() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const item = await inboxRequest<Lead>(`/leads/${encodeURIComponent(lead.id)}`);
      if (!alive.current) return;
      setBaseline(item);
      setStatus(item.status);
      setNotes(item.notes || "");
      setFollowUp(localDateTime(item.followUpAt));
      setConflict(false);
      setReloadRequested(false);
      onSaved(item);
      setSuccess("Latest version loaded.");
    } catch (cause) {
      if (alive.current && !handleError(cause))
        setError("We couldn’t load the latest version. Please try again.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return (
    <div className="li-lead-detail">
      <div className="li-detail-topline">
        <button className="li-mobile-back li-text-button" onClick={onClose}>
          <ArrowLeft size={16} /> All enquiries
        </button>
        <span>{baseline.reference}</span>
        <button className="li-icon-button" aria-label="Close enquiry details" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="li-detail-name">
        <span className="li-eyebrow">{leadKindLabels[baseline.kind] || "ENQUIRY"}</span>
        <h2 ref={heading} tabIndex={-1}>
          {baseline.name}
        </h2>
        <p>{baseline.city}</p>
        <StatusBadge status={baseline.status} />
      </div>
      <dl className="li-contact-details">
        <div>
          <dt>PHONE</dt>
          <dd>
            <a href={`tel:${baseline.phone.replace(/[^+0-9]/g, "")}`}>{baseline.phone}</a>
          </dd>
        </div>
        <div>
          <dt>RECEIVED</dt>
          <dd>{inboxDate(baseline.createdAt)} IST</dd>
        </div>
      </dl>
      <div className="li-contact-actions">
        <a
          className="li-button li-button-light"
          href={`tel:${baseline.phone.replace(/[^+0-9]/g, "")}`}
        >
          <Phone size={15} /> Call customer
        </a>
        <a
          className="li-button li-whatsapp-link"
          href={`https://wa.me/${baseline.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          <MessageCircle size={16} /> Open WhatsApp
        </a>
      </div>
      <section className="li-customer-message">
        <h3>What they have in mind</h3>
        <p>{baseline.message}</p>
      </section>
      <form className="li-followup-form" onSubmit={(event) => void save(event)}>
        <div className="li-section-heading">
          <h3>The next step</h3>
          {dirty && <span className="li-unsaved">Unsaved changes</span>}
        </div>
        <div className="li-detail-form-grid">
          <div>
            <label htmlFor="detail-status">Enquiry status</label>
            <select
              id="detail-status"
              value={status}
              disabled={busy}
              onChange={(event) => {
                setStatus(event.target.value as LeadStatus);
                setSuccess("");
              }}
            >
              {leadStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="detail-followup">
              Follow-up time <span>(your local time)</span>
            </label>
            <input
              id="detail-followup"
              type="datetime-local"
              value={followUp}
              disabled={busy}
              onChange={(event) => {
                setFollowUp(event.target.value);
                setSuccess("");
              }}
            />
          </div>
        </div>
        <label htmlFor="detail-notes">
          Team notes <span>Private to your team</span>
        </label>
        <textarea
          id="detail-notes"
          value={notes}
          disabled={busy}
          maxLength={4000}
          rows={5}
          placeholder="What did you discuss? What should happen next?"
          onChange={(event) => {
            setNotes(event.target.value);
            setSuccess("");
          }}
        />
        <div className="li-notes-meta">
          <span>Never add passwords, payment details or API keys.</span>
          <span>{notes.length.toLocaleString("en-IN")}/4,000</span>
        </div>
        {error && <Notice danger>{error}</Notice>}
        {conflict && !reloadRequested && (
          <button
            className="li-button li-button-light"
            type="button"
            onClick={() => setReloadRequested(true)}
          >
            <RefreshCw size={16} /> Load latest version
          </button>
        )}
        {reloadRequested && (
          <div className="li-confirm-box">
            <p>
              Loading the latest version will replace your unsaved edits. Copy any notes you want to
              keep first.
            </p>
            <button
              className="li-button li-button-light"
              type="button"
              disabled={busy}
              onClick={() => void reload()}
            >
              Replace edits & load latest
            </button>
            <button
              className="li-text-button"
              type="button"
              disabled={busy}
              onClick={() => setReloadRequested(false)}
            >
              Keep editing
            </button>
          </div>
        )}
        {success && (
          <p className="li-save-success" role="status">
            <Check size={17} /> {success}
          </p>
        )}
        <div className="li-save-row">
          <span>Last updated {inboxDate(baseline.updatedAt)} IST</span>
          <button
            className="li-button li-button-primary"
            type="submit"
            disabled={busy || !dirty || conflict}
          >
            {busy ? (
              <>
                <LoaderCircle className="li-spin" size={16} /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function OwnerOverview({
  handleError,
  onOpenInbox,
}: {
  handleError: HandleError;
  onOpenInbox: () => void;
}) {
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    inboxRequest<LeadList>("/leads?page=1", { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setSummary(data.summary);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && !handleError(cause))
          setError("We couldn’t load the overview. Please refresh to try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [revision, handleError]);
  const cards = summary
    ? [
        {
          label: "All enquiries",
          value: summary.total,
          description: "Saved from your website",
          icon: Inbox,
        },
        {
          label: "New enquiries",
          value: summary.new,
          description: "Ready for a first conversation",
          icon: MessageCircle,
        },
        {
          label: "Follow-ups due",
          value: summary.followUpsDue,
          description: "Scheduled for now or earlier",
          icon: CalendarClock,
        },
        {
          label: "Qualified",
          value: summary.qualified,
          description: "Marked as a potential project",
          icon: Check,
        },
      ]
    : [];
  return (
    <>
      <div className="li-page-heading">
        <div>
          <span className="li-eyebrow">OWNER OVERVIEW</span>
          <h1>
            A clearer picture<span className="li-heading-dot">.</span>
          </h1>
          <p>Your enquiries and the conversations that need attention.</p>
        </div>
        <button
          className="li-button li-button-light"
          disabled={busy}
          onClick={() => setRevision((value) => value + 1)}
        >
          <RefreshCw size={16} className={busy ? "li-spin" : ""} /> Refresh
        </button>
      </div>
      {error && <Notice danger>{error}</Notice>}
      {busy && !summary ? (
        <div className="li-empty" role="status">
          <LoaderCircle className="li-spin" size={25} />
          <p>Loading your enquiry overview…</p>
        </div>
      ) : (
        summary && (
          <>
            <div className="li-stat-grid">
              {cards.map((card) => (
                <div className="li-stat-card" key={card.label}>
                  <span className="li-stat-icon">
                    <card.icon size={21} />
                  </span>
                  <span>{card.label}</span>
                  <strong>{card.value.toLocaleString("en-IN")}</strong>
                  <p>{card.description}</p>
                </div>
              ))}
            </div>
            <div className="li-overview-grid">
              <section className="li-surface li-pipeline">
                <span className="li-eyebrow">THE CONVERSATION PIPELINE</span>
                <h2>Every next step counts.</h2>
                <div>
                  {leadStatuses.map((item) => (
                    <div className="li-pipeline-row" key={item.value}>
                      <StatusBadge status={item.value} />
                      <span className="li-pipeline-track">
                        <span
                          style={{
                            width: `${summary.total ? Math.max(2, (summary[item.value] / summary.total) * 100) : 0}%`,
                          }}
                        />
                      </span>
                      <strong>{summary[item.value]}</strong>
                    </div>
                  ))}
                </div>
                <button className="li-button li-button-primary" onClick={onOpenInbox}>
                  Open lead inbox <Inbox size={16} />
                </button>
              </section>
              <section className="li-owner-note">
                <ShieldCheck size={27} />
                <span className="li-eyebrow">YOUR MASTER WORKSPACE</span>
                <h2>
                  A small team.
                  <br />
                  Clear responsibility.
                </h2>
                <p>
                  Review incoming enquiries, keep follow-up notes together and manage who has access
                  from Team access.
                </p>
                <div className="li-owner-note-rule" />
                <p className="li-small">
                  These are saved enquiries, not visitor counts or confirmed sales. Calls and
                  WhatsApp conversations happen only when your team chooses to begin them.
                </p>
              </section>
            </div>
          </>
        )
      )}
    </>
  );
}

function TeamPanel({
  user,
  csrfToken,
  handleError,
}: {
  user: InboxUser;
  csrfToken: string;
  handleError: HandleError;
}) {
  const [data, setData] = useState<TeamAccess | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingDisable, setPendingDisable] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    inboxRequest<TeamAccess>("/team", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && !handleError(cause))
          setError("We couldn’t load team access. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [revision, handleError]);

  async function updateMember(memberEmail: string, active: boolean) {
    setSaving(memberEmail);
    setError("");
    setSuccess("");
    try {
      const member = await inboxRequest<TeamMember>("/team", {
        method: "POST",
        csrfToken,
        body: { email: memberEmail.trim().toLowerCase(), active },
      });
      if (!alive.current) return;
      setData((previous) =>
        previous
          ? {
              ...previous,
              members: [...previous.members.filter((item) => item.id !== member.id), member],
            }
          : previous,
      );
      setEmail("");
      setPendingDisable(null);
      setSuccess(
        active
          ? "Team access is active. This account can sign in with its existing password."
          : "Team access disabled. This account can no longer use the inbox.",
      );
      setRevision((value) => value + 1);
    } catch (cause) {
      if (!alive.current || handleError(cause)) return;
      setError(
        cause instanceof InboxApiError && cause.status === 404
          ? "That account was not found. First create the staff account securely in Supabase Authentication, then add its email here."
          : inboxError(
              cause,
              "We couldn’t update team access. Check that the account exists in Supabase and try again.",
            ),
      );
    } finally {
      if (alive.current) setSaving("");
    }
  }

  return (
    <>
      <div className="li-page-heading">
        <div>
          <span className="li-eyebrow">OWNER CONTROLS</span>
          <h1>
            The right people<span className="li-heading-dot">.</span>
          </h1>
          <p>Keep your customer conversations in trusted hands.</p>
        </div>
        <span className="li-owner-badge">
          <ShieldCheck size={16} /> Owner access
        </span>
      </div>
      {error && <Notice danger>{error}</Notice>}
      {success && (
        <p className="li-save-success" role="status">
          <Check size={17} /> {success}
        </p>
      )}
      <div className="li-team-grid">
        <section className="li-surface">
          <div className="li-section-heading">
            <h2>Team access</h2>
            <button
              className="li-icon-button"
              aria-label="Refresh team access"
              disabled={busy || !!saving}
              onClick={() => setRevision((value) => value + 1)}
            >
              <RefreshCw size={17} className={busy ? "li-spin" : ""} />
            </button>
          </div>
          <p className="li-muted li-small">
            The owner controls access. Staff can view and update enquiries; only the owner manages
            the team.
          </p>
          {busy && !data ? (
            <p className="li-loading" role="status">
              <LoaderCircle className="li-spin" size={18} /> Loading team members…
            </p>
          ) : (
            <div className="li-team-members">
              {data?.members.map((member) => (
                <div className="li-team-member" key={member.id}>
                  <span className="li-team-avatar">
                    {(member.displayName || member.email).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="li-team-member-copy">
                    <strong>
                      {member.displayName || member.email}
                      {member.id === user.id ? " (you)" : ""}
                    </strong>
                    <span>{member.email}</span>
                    <span className="li-member-meta">
                      {member.role === "owner" ? "Owner" : "Staff"} ·{" "}
                      {member.active ? "Active" : "Access disabled"}
                    </span>
                  </div>
                  {member.role === "owner" ? (
                    <span className="li-protected">
                      <ShieldCheck size={14} /> Protected
                    </span>
                  ) : (
                    <button
                      className={`li-button li-button-small ${member.active ? "li-button-danger" : "li-button-light"}`}
                      disabled={!!saving}
                      onClick={() =>
                        member.active
                          ? setPendingDisable(member.email)
                          : void updateMember(member.email, true)
                      }
                    >
                      {saving === member.email
                        ? "Updating…"
                        : member.active
                          ? "Disable"
                          : "Reactivate"}
                    </button>
                  )}
                  {pendingDisable === member.email && (
                    <div className="li-confirm-box li-member-confirm">
                      <p>
                        Disable {member.email}? Their inbox access will end. Existing leads and
                        notes will be kept.
                      </p>
                      <button
                        className="li-button li-button-danger li-button-small"
                        disabled={!!saving}
                        onClick={() => void updateMember(member.email, false)}
                      >
                        Disable access
                      </button>
                      <button
                        className="li-text-button"
                        disabled={!!saving}
                        onClick={() => setPendingDisable(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="li-surface li-add-member">
          <Users size={25} />
          <h2>Add a team member</h2>
          <p>
            First create their account and password in{" "}
            <strong>Supabase → Authentication → Users</strong>. Then enter the same email here to
            grant staff access.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void updateMember(email, true);
            }}
          >
            <label htmlFor="staff-email">Existing staff account email</label>
            <input
              id="staff-email"
              type="email"
              autoComplete="off"
              value={email}
              maxLength={254}
              required
              disabled={!!saving || busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@luxeinfra.in"
            />
            <button className="li-button li-button-primary" disabled={!!saving || busy}>
              {saving && saving === email ? (
                <LoaderCircle className="li-spin" size={16} />
              ) : (
                <Users size={16} />
              )}{" "}
              Grant staff access
            </button>
          </form>
          <p className="li-form-help">
            This grants access only. It does not send an invitation email or create an account.
          </p>
        </section>
      </div>
      <section className="li-surface li-activity">
        <div className="li-section-heading">
          <h2>Recent workspace activity</h2>
          <Activity size={20} />
        </div>
        <p className="li-muted li-small">A record of lead updates and team access changes.</p>
        {data?.audit.length ? (
          <ol>
            {data.audit.map((entry) => (
              <li key={entry.id}>
                <span className="li-activity-dot" />
                <div>
                  <strong>{entry.actorName || "Team member"}</strong>
                  <p>
                    {entry.action.replace(/[_-]/g, " ")}
                    {entry.leadReference ? ` · ${entry.leadReference}` : ""}
                    {entry.targetEmail ? ` · ${entry.targetEmail}` : ""}
                  </p>
                </div>
                <time dateTime={entry.createdAt}>{inboxDate(entry.createdAt)} IST</time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="li-activity-empty">
            Workspace activity will appear here as your team works through enquiries.
          </p>
        )}
      </section>
    </>
  );
}
