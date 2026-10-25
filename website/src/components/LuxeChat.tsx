import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import {
  MessageCircle,
  Send,
  X,
  RotateCcw,
  Sparkles,
  House,
  Building2,
  Wallet,
  Palette,
} from "lucide-react";
import {
  looksSensitiveChatInput,
  chatRequestsOverride,
  luxeLocalReply,
  luxeSuggestions,
  type LuxeChatAction,
} from "@/lib/luxe-chat";
import "@/luxe-chat.css";

type Message = {
  role: "user" | "assistant";
  text: string;
  ai?: boolean;
  actions?: LuxeChatAction[];
};
const greeting: Message = {
  role: "assistant",
  text: "Hi, I’m Luxe. Tell me a little about the space you’re dreaming of. A whole home, one room, or somewhere for your business?",
};

export function LuxeChat() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const transcript = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const turn = useRef(0);
  const updateOpen = useCallback((next: boolean) => {
    if (!next) {
      turn.current++;
      controller.current?.abort();
      setBusy(false);
      setAiConsent(false);
    }
    setOpen(next);
  }, []);
  useEffect(() => {
    const onWelcome = (event: Event) => {
      const isOpen = Boolean((event as CustomEvent<{ open: boolean }>).detail?.open);
      setWelcomeOpen(isOpen);
      if (isOpen) updateOpen(false);
    };
    window.addEventListener("luxe:welcome-visibility", onWelcome);
    return () => {
      window.removeEventListener("luxe:welcome-visibility", onWelcome);
      controller.current?.abort();
    };
  }, [updateOpen]);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("luxe:chat-visibility", {
        detail: { open: open && !welcomeOpen && pathname !== "/privacy" },
      }),
    );
    return () => {
      window.dispatchEvent(new CustomEvent("luxe:chat-visibility", { detail: { open: false } }));
    };
  }, [open, welcomeOpen, pathname]);
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    fetch("/api/luxe-chat/status", { signal: abort.signal, credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((status) => setAiAvailable(status?.enabled === true))
      .catch(() => setAiAvailable(false));
    return () => abort.abort();
  }, [open]);
  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, busy]);

  async function ask(value: string) {
    const text = value.trim().slice(0, 500);
    if (!text || busy) return;
    const local = luxeLocalReply(text);
    setQuestion("");
    setMessages((items) => [...items.slice(-17), { role: "user", text }]);
    if (!aiAvailable || !aiConsent || looksSensitiveChatInput(text) || chatRequestsOverride(text)) {
      setMessages((items) => [...items, { role: "assistant", ...local }]);
      input.current?.focus();
      return;
    }
    setBusy(true);
    const thisTurn = ++turn.current;
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 25000);
    try {
      const response = await fetch("/api/luxe-chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, consent: true }),
        signal: abort.signal,
      });
      const result = await response.json();
      if (!response.ok || typeof result.reply !== "string") throw new Error("unavailable");
      if (thisTurn === turn.current)
        setMessages((items) => [
          ...items,
          { role: "assistant", text: result.reply, ai: true, actions: local.actions },
        ]);
    } catch {
      if (thisTurn === turn.current)
        setMessages((items) => [
          ...items,
          {
            role: "assistant",
            text: `I can still help with a quick answer while the AI connection is unavailable.\n\n${local.text}`,
            actions: local.actions,
          },
        ]);
    } finally {
      window.clearTimeout(timeout);
      if (thisTurn === turn.current) setBusy(false);
      input.current?.focus();
    }
  }
  function clear() {
    turn.current++;
    controller.current?.abort();
    setBusy(false);
    setMessages([greeting]);
    setAiConsent(false);
    setQuestion("");
    input.current?.focus();
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }
  if (welcomeOpen || pathname === "/privacy") return null;
  return (
    <Dialog.Root open={open} onOpenChange={updateOpen} modal={false}>
      <Dialog.Trigger className="luxe-chat-launcher" aria-label="Ask Luxe, your interiors guide">
        <span className="luxe-chat-launcher-icon">
          <MessageCircle size={23} aria-hidden="true" />
        </span>
        <span>
          <strong>Ask Luxe</strong>
          <small>A little help with your space</small>
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="luxe-chat-panel"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
        >
          <header className="luxe-chat-header">
            <span className="luxe-chat-avatar">L</span>
            <div>
              <Dialog.Title>Luxe</Dialog.Title>
              <Dialog.Description>
                Your interior companion ·{" "}
                {aiAvailable && aiConsent ? "AI conversation" : "Quick answers"}
              </Dialog.Description>
            </div>
            <button
              type="button"
              onClick={clear}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <RotateCcw size={17} />
            </button>
            <Dialog.Close aria-label="Close Luxe chat">
              <X size={20} />
            </Dialog.Close>
          </header>
          <div
            className="luxe-chat-transcript"
            ref={transcript}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Conversation with Luxe"
          >
            <div className="luxe-chat-welcome">
              <span>MAKE YOURSELF AT HOME</span>
              <p className="luxe-chat-intro">
                A little inspiration.
                <br />A better place to begin.
              </p>
            </div>
            {messages.map((message, index) => (
              <div key={index} className={`luxe-chat-message luxe-chat-message--${message.role}`}>
                {message.role === "assistant" && (
                  <span className="luxe-chat-message-label">Luxe {message.ai ? "· AI" : ""}</span>
                )}
                <p>{message.text}</p>
                {message.actions && (
                  <div className="luxe-chat-links">
                    {message.actions.map((action) => (
                      <Link
                        key={action.label}
                        to={action.to}
                        search={
                          action.commercial
                            ? { scope: "Commercial space", commercial: action.commercialType }
                            : {}
                        }
                        onClick={() => updateOpen(false)}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <p className="luxe-chat-thinking" role="status">
                <span /> Luxe is thinking…
              </p>
            )}
            {messages.length === 1 && (
              <div className="luxe-chat-suggestions" aria-label="Choose a starting point">
                {luxeSuggestions.map((label, index) => {
                  const Icon = [House, Building2, Wallet, Palette][index] || MessageCircle;
                  return (
                    <button key={label} disabled={busy} onClick={() => void ask(label)}>
                      <Icon size={17} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {aiAvailable && (
            <div className="luxe-chat-ai-invite">
              <button
                type="button"
                aria-pressed={aiConsent}
                onClick={() => setAiConsent(!aiConsent)}
                disabled={busy}
              >
                <Sparkles size={15} />
                {aiConsent ? "AI conversation on · pause" : "Start an AI conversation"}
              </button>
              {!aiConsent && <small>Uses Google Gemini. Keep personal details out of chat.</small>}
            </div>
          )}
          <form className="luxe-chat-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="luxe-chat-question">
              Ask about your interiors
            </label>
            <input
              ref={input}
              id="luxe-chat-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              placeholder="Ask Luxe about your space…"
              autoComplete="off"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !question.trim()} aria-label="Send question">
              <Send size={18} />
            </button>
          </form>
          <p className="luxe-chat-footnote">
            Your digital interior assistant. Studio confirms prices and site feasibility.{" "}
            <Link to="/privacy" onClick={() => updateOpen(false)}>
              Privacy
            </Link>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
