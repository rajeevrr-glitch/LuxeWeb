import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import inboxCss from "@/styles/admin.css?url";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset workspace password — LuxeInfra" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
    links: [{ rel: "stylesheet", href: inboxCss }],
  }),
  component: ResetPassword,
});

type RecoverySession = { enabled: boolean; authenticated: boolean; csrfToken?: string };
type View = "loading" | "request" | "ready" | "expired" | "unavailable" | "complete";

async function recoveryRequest(path: string, body?: unknown, csrf?: string): Promise<unknown> {
  const response = await fetch("/api/admin/recovery/" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(15_000),
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(csrf ? { "X-Luxe-CSRF": csrf } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<unknown>;
}

function validSession(value: unknown): value is RecoverySession {
  return Boolean(
    value &&
    typeof value === "object" &&
    "enabled" in value &&
    typeof value.enabled === "boolean" &&
    "authenticated" in value &&
    typeof value.authenticated === "boolean" &&
    (!value.authenticated ||
      ("csrfToken" in value &&
        typeof value.csrfToken === "string" &&
        /^[a-f0-9]{64}$/.test(value.csrfToken))),
  );
}

function hasControl(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

function ResetPassword() {
  const [view, setView] = useState<View>("loading");
  const [csrf, setCsrf] = useState("");
  const [email, setEmail] = useState("sales@luxeinfra.in");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);
  const boot = useRef<Promise<RecoverySession> | null>(null);

  useEffect(() => {
    let active = true;
    if (!boot.current) {
      boot.current = (async () => {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const query = new URLSearchParams(window.location.search);
        const hadFragment = Boolean(window.location.hash);
        // Remove credentials before any request, state update or navigation.
        window.history.replaceState(window.history.state, "", window.location.pathname);
        if (
          fragment.has("error") ||
          fragment.has("error_code") ||
          query.has("error") ||
          query.has("error_code") ||
          query.has("code")
        )
          throw new Error("expired");
        let accessToken = fragment.get("access_token") ?? "";
        try {
          if (hadFragment) {
            if (
              fragment.getAll("access_token").length !== 1 ||
              fragment.getAll("type").length !== 1 ||
              fragment.get("type") !== "recovery" ||
              accessToken.length < 64 ||
              accessToken.length > 2800 ||
              !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken)
            )
              throw new Error("expired");
            const result = await recoveryRequest("establish", { accessToken });
            if (!validSession(result) || !result.enabled || !result.authenticated)
              throw new Error("expired");
            return result;
          }
          const result = await recoveryRequest("session");
          if (!validSession(result)) throw new Error("unavailable");
          return result;
        } finally {
          accessToken = "";
          fragment.delete("access_token");
          fragment.delete("refresh_token");
        }
      })();
    }
    void boot.current.then(
      (session) => {
        if (!active) return;
        setCsrf(session.csrfToken ?? "");
        setView(!session.enabled ? "unavailable" : session.authenticated ? "ready" : "request");
      },
      (cause: unknown) => {
        if (!active) return;
        setView(
          cause instanceof Error && cause.message === "unavailable" ? "unavailable" : "expired",
        );
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function requestLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setRequested(false);
    try {
      await recoveryRequest("request", { email: email.trim() });
      setRequested(true);
    } catch {
      setError(
        "We couldn’t request a link. Please wait a few minutes and try again on the live website.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (password.length < 12 || password.length > 128 || hasControl(password)) {
      setError("Use 12–128 characters. A unique passphrase is a good choice.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords don’t match. Please enter the same password in both fields.");
      return;
    }
    setBusy(true);
    try {
      const result = await recoveryRequest("complete", { password }, csrf);
      if (
        !result ||
        typeof result !== "object" ||
        !("complete" in result) ||
        result.complete !== true
      )
        throw new Error("incomplete");
      setCsrf("");
      setView("complete");
    } catch (cause) {
      if (cause instanceof Error && ["401", "403"].includes(cause.message)) {
        setCsrf("");
        setView("expired");
      } else {
        setError(
          "We couldn’t save that password. Try a different strong password, or request a fresh link if this one has expired.",
        );
      }
    } finally {
      setPassword("");
      setConfirm("");
      setBusy(false);
    }
  }

  const title =
    view === "complete"
      ? "You’re ready to sign in."
      : view === "ready"
        ? "Choose a new password."
        : "Back to your workspace.";
  return (
    <div className="li-admin li-login-shell li-recovery">
      <aside className="li-login-story">
        <div className="li-brand li-brand-light">
          <strong>
            LUXE<span>INFRA</span>
          </strong>
          <span className="li-brand-caption">STUDIO WORKSPACE</span>
        </div>
        <div className="li-story-copy">
          <span className="li-eyebrow">PRIVATE OWNER ACCESS</span>
          <h1>
            A fresh start.
            <br />
            Your work stays here.
          </h1>
          <p>
            Your enquiries, notes and team access stay safely in place while you update your
            password.
          </p>
        </div>
        <div className="li-story-footer">
          <ShieldCheck size={19} aria-hidden="true" /> Secure owner recovery
        </div>
      </aside>
      <main className="li-login-main">
        <div className="li-login-card">
          <a className="li-back-link" href="/admin">
            <ArrowLeft size={15} aria-hidden="true" /> Back to sign in
          </a>
          <span className="li-eyebrow">LUXEINFRA WORKSPACE</span>
          <h2>{title}</h2>
          {view === "loading" && (
            <p className="li-muted" role="status">
              <LoaderCircle size={18} className="li-spin" aria-hidden="true" /> Checking your secure
              link…
            </p>
          )}
          {view === "unavailable" && (
            <div className="li-notice li-notice-danger" role="alert">
              <CircleAlert size={18} aria-hidden="true" />
              <p>
                Password recovery is unavailable here. Open this page on your live LuxeInfra
                website, or ask the workspace owner to check the connection.
              </p>
            </div>
          )}
          {view === "complete" && (
            <>
              <div className="li-notice" role="status">
                <Check size={18} aria-hidden="true" />
                <p>Your password is updated. Sign in to your lead inbox using your new password.</p>
              </div>
              <a className="li-button li-button-primary" href="/admin">
                Go to sign in <LockKeyhole size={16} aria-hidden="true" />
              </a>
            </>
          )}
          {view === "ready" && (
            <>
              <p className="li-muted">
                Choose a unique password with at least 12 characters. This secure session expires
                after 15 minutes.
              </p>
              <form className="li-login-form" onSubmit={(event) => void changePassword(event)}>
                <label htmlFor="owner-new-password">New password</label>
                <div className="li-password-field">
                  <input
                    id="owner-new-password"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={12}
                    maxLength={128}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-pressed={show}
                    disabled={busy}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                <label htmlFor="owner-confirm-password">Confirm new password</label>
                <input
                  id="owner-confirm-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  minLength={12}
                  maxLength={128}
                  disabled={busy}
                />
                {error && (
                  <div className="li-notice li-notice-danger" role="alert">
                    <CircleAlert size={18} aria-hidden="true" />
                    <p>{error}</p>
                  </div>
                )}
                <button type="submit" className="li-button li-button-primary" disabled={busy}>
                  {busy ? (
                    <>
                      <LoaderCircle className="li-spin" size={18} aria-hidden="true" /> Saving
                      password…
                    </>
                  ) : (
                    <>
                      Save new password <KeyRound size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
          {(view === "request" || view === "expired") && (
            <>
              {view === "expired" && (
                <div className="li-notice li-notice-danger" role="alert">
                  <CircleAlert size={18} aria-hidden="true" />
                  <p>
                    This reset link is incomplete or has expired. Request a new link below and open
                    the latest email.
                  </p>
                </div>
              )}
              <p className="li-muted">
                Enter the owner email to request a secure password reset link.
              </p>
              <form className="li-login-form" onSubmit={(event) => void requestLink(event)}>
                <label htmlFor="owner-recovery-email">Owner email</label>
                <input
                  id="owner-recovery-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setRequested(false);
                  }}
                  required
                  maxLength={254}
                  disabled={busy}
                />
                {error && (
                  <div className="li-notice li-notice-danger" role="alert">
                    <CircleAlert size={18} aria-hidden="true" />
                    <p>{error}</p>
                  </div>
                )}
                {requested && (
                  <div className="li-notice" role="status">
                    <Mail size={18} aria-hidden="true" />
                    <p>
                      If this address is eligible for owner recovery, a reset link will arrive
                      shortly. Check Spam/Junk and use the newest email.
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  className="li-button li-button-primary"
                  disabled={busy || requested}
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="li-spin" size={18} aria-hidden="true" /> Requesting
                      link…
                    </>
                  ) : (
                    <>
                      Email a reset link <Mail size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
          <p className="li-login-note">
            Keep your password and reset link private. LuxeInfra will never ask you to share them in
            chat.
          </p>
        </div>
      </main>
    </div>
  );
}
