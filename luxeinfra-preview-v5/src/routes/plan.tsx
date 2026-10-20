import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, FileText, X, Download } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { takeRoomBrief } from "@/lib/visualiser-brief";
import { business, rooms, workOptions } from "@/lib/business";
import { readInspiration, saveInspiration, type Inspiration } from "@/lib/inspiration";
import warm from "@/assets/living.jpg";
import classic from "@/assets/bedroom.jpg";
import natural from "@/assets/dining.jpg";

export const Route = createFileRoute("/plan")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { scope?: string; room?: string; style?: string; roomBrief?: string } => ({
    roomBrief: search.roomBrief === "1" ? "1" : undefined,
    scope: typeof search.scope === "string" ? search.scope : undefined,
    room: typeof search.room === "string" && rooms.includes(search.room) ? search.room : undefined,
    style:
      typeof search.style === "string" &&
      ["Warm minimal", "Modern classic", "Natural & relaxed", "Help me choose"].includes(
        search.style,
      )
        ? search.style
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plan My Space — LuxeInfra" },
      {
        name: "description",
        content:
          "Choose your rooms, select the work, and share your floor plan for a tailored interior estimate.",
      },
    ],
  }),
  component: Planner,
});

type Draft = {
  region: string;
  city: string;
  property: string;
  area: string;
  condition: string;
  configuration: string;
  readiness: string;
  scope: string;
  rooms: string[];
  work: Record<string, string[]>;
  roomPriorities: Record<string, string>;
  style: string;
  priorities: string[];
  budget: string;
  timing: string;
  name: string;
  phone: string;
  email: string;
  method: string;
  time: string;
  notes: string;
  consent: boolean;
  website: string;
};
const empty: Draft = {
  region: "Uttar Pradesh",
  city: "",
  property: "Apartment",
  area: "",
  condition: "New home",
  configuration: "Not sure",
  readiness: "To discuss",
  scope: "Selected rooms",
  rooms: [],
  work: {},
  roomPriorities: {},
  style: "Help me choose",
  priorities: [],
  budget: "Need guidance",
  timing: "Exploring ideas",
  name: "",
  phone: "",
  email: "",
  method: "Phone",
  time: "Any time",
  notes: "",
  consent: false,
  website: "",
};
const steps = ["Your space", "The work", "Your style", "Plan & budget", "Review"];
const roomPriorityOptions = ["Discuss with designer", "First priority", "Can wait"];
function Choice({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="choice" aria-pressed={selected} onClick={onClick}>
      {selected ? "✓ " : ""}
      {label}
    </button>
  );
}

function Planner() {
  const search = Route.useSearch();
  const [draft, setDraft] = useState<Draft>(empty);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [receipt, setReceipt] = useState<{ reference: string; mode: string } | null>(null);
  const id = useRef("");
  const title = useRef<HTMLHeadingElement>(null);
  const request = useRef<XMLHttpRequest | null>(null);
  const initialised = useRef(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  useEffect(() => {
    if (initialised.current) return () => request.current?.abort();
    initialised.current = true;
    id.current = crypto.randomUUID();
    try {
      const saved = JSON.parse(localStorage.getItem("luxe-plan-choices") || "null");
      if (saved && typeof saved === "object")
        setDraft((d) => ({
          ...d,
          rooms: Array.isArray(saved.rooms)
            ? saved.rooms.filter((r: string) => rooms.includes(r))
            : [],
          work:
            saved.work && typeof saved.work === "object"
              ? Object.fromEntries(
                  Object.entries(saved.work)
                    .filter(([r]) => rooms.includes(r))
                    .map(([r, v]) => [
                      r,
                      Array.isArray(v) ? v.filter((w) => workOptions.includes(w)) : [],
                    ]),
                )
              : {},
          style: ["Warm minimal", "Modern classic", "Natural & relaxed", "Help me choose"].includes(
            saved.style,
          )
            ? saved.style
            : d.style,
          roomPriorities:
            saved.roomPriorities && typeof saved.roomPriorities === "object"
              ? (Object.fromEntries(
                  Object.entries(saved.roomPriorities).filter(
                    ([room, value]) =>
                      Array.isArray(saved.rooms) &&
                      saved.rooms.includes(room) &&
                      rooms.includes(room) &&
                      typeof value === "string" &&
                      roomPriorityOptions.includes(value),
                  ),
                ) as Record<string, string>)
              : {},
        }));
    } catch {
      /* A private browser may not allow local storage. */
    }
    if (search.scope === "Whole home")
      setDraft((d) => ({
        ...d,
        scope: "Whole home",
        rooms: ["Kitchen", "Living & dining", "Master bedroom", "Other bedrooms"],
        roomPriorities: Object.fromEntries(
          Object.entries(d.roomPriorities).filter(([room]) =>
            ["Kitchen", "Living & dining", "Master bedroom", "Other bedrooms"].includes(room),
          ),
        ),
      }));
    if (search.scope === "Selected rooms") set("scope", "Selected rooms");
    if (search.room)
      setDraft((d) => ({
        ...d,
        scope: "Selected rooms",
        rooms: Array.from(new Set([...d.rooms, search.room!])),
      }));
    if (search.style) set("style", search.style);
    if (search.roomBrief === "1") {
      const roomBrief = takeRoomBrief();
      if (roomBrief) {
        setDraft((d) => ({
          ...d,
          scope: "Selected rooms",
          rooms: [roomBrief.room],
          work: {},
          roomPriorities: {},
          style: roomBrief.style,
          notes: roomBrief.notes,
        }));
        setFiles(roomBrief.files);
      }
    }
    setInspirations(readInspiration());
    setLoaded(true);
    return () => request.current?.abort();
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          "luxe-plan-choices",
          JSON.stringify({
            rooms: draft.rooms,
            work: draft.work,
            style: draft.style,
            roomPriorities: draft.roomPriorities,
          }),
        );
      } catch {}
  }, [draft.rooms, draft.work, draft.style, draft.roomPriorities, loaded]);
  function go(next: number) {
    setError("");
    setStep(next);
    setTimeout(() => title.current?.focus(), 0);
  }
  function next() {
    if (step === 0 && draft.city.trim().length < 2)
      return setError("Please enter your city or locality.");
    if (
      step === 0 &&
      draft.area &&
      (!/^\d+(\.\d+)?$/.test(draft.area) || Number(draft.area) <= 0 || Number(draft.area) > 1000000)
    )
      return setError("Enter a valid positive carpet area, or leave it blank.");
    if (step === 1 && !draft.rooms.length)
      return setError("Choose at least one space, including “Other space” if you need guidance.");
    if (
      step === 1 &&
      draft.scope !== "Help me decide" &&
      draft.rooms.some((r) => !draft.work[r]?.length)
    )
      return setError("Choose the work for each room, or select “Help me decide”.");
    go(step + 1);
  }
  function selectRoom(room: string) {
    setDraft((d) => {
      const selected = d.rooms.includes(room);
      const work = { ...d.work };
      const roomPriorities = { ...d.roomPriorities };
      if (selected) {
        delete work[room];
        delete roomPriorities[room];
      }
      return {
        ...d,
        rooms: selected ? d.rooms.filter((r) => r !== room) : [...d.rooms, room],
        work,
        roomPriorities,
      };
    });
  }
  function selectWork(room: string, work: string) {
    const current = draft.work[room] || [];
    set("work", {
      ...draft.work,
      [room]: current.includes(work) ? current.filter((w) => w !== work) : [...current, work],
    });
  }
  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setError("");
    if (files.length + incoming.length > 3)
      return setError("You can attach up to three files. Remove a file before adding another.");
    if (
      incoming.some(
        (f) =>
          !["application/pdf", "image/jpeg", "image/png"].includes(f.type) ||
          !f.size ||
          f.size > 10 * 1024 * 1024,
      )
    )
      return setError(
        "Choose PDF, JPG, or PNG files, up to 10 MB each. Empty files are not accepted.",
      );
    setFiles([...files, ...incoming]);
  }
  function summary() {
    return [
      "LUXEINFRA — MY SPACE BRIEF",
      receipt ? `Reference: ${receipt.reference}` : "",
      `Location: ${draft.city}, ${draft.region}`,
      `${draft.property} · ${draft.condition}${draft.area ? ` · ${draft.area} sq ft carpet area` : ""}`,
      `Home configuration: ${draft.configuration}`,
      `Site readiness: ${draft.readiness}`,
      `Scope: ${draft.scope}`,
      ...draft.rooms.map(
        (r) =>
          `${r} [${draft.roomPriorities[r] || "Discuss with designer"}]: ${(draft.work[r] || []).join(", ") || "Please advise"}`,
      ),
      "Room priorities express preferences; the designer must review work sequencing and feasibility.",
      `Style: ${draft.style}`,
      `Priorities: ${draft.priorities.join(", ") || "To discuss"}`,
      `Budget: ${draft.budget}`,
      `Timing: ${draft.timing}`,
      `Inspiration: ${inspirations.map((i) => i.id).join(", ") || "None selected"}`,
      `Files: ${files.map((f) => f.name).join(", ") || "None"}`,
      `Name: ${draft.name}`,
      `Phone: ${draft.phone}`,
      `Email: ${draft.email || "Not provided"}`,
      `Preferred contact: ${draft.method}, ${draft.time}`,
      `Notes: ${draft.notes || "None"}`,
      "This is a project brief, not a quotation.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  function download() {
    const blob = new Blob([summary()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receipt?.reference || "LuxeInfra-project-brief"}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 4) {
      next();
      return;
    }
    if (sending) return;
    setError("");
    if (draft.name.trim().length < 2) return setError("Please enter your name.");
    if (!/^(?:\+?91[ -]?)?[6-9]\d{9}$/.test(draft.phone.replace(/\s/g, "")))
      return setError("Enter a valid Indian mobile number, with or without +91.");
    if (
      (draft.email || draft.method === "Email") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)
    )
      return setError("Please enter a valid email address.");
    if (!draft.consent)
      return setError("Please confirm that your details may be used to respond to this enquiry.");
    const form = new FormData();
    form.append(
      "brief",
      JSON.stringify({
        ...draft,
        id: id.current,
        inspirations: inspirations.map(({ id, title }) => ({ id, title })),
      }),
    );
    files.forEach((f) => form.append("files", f));
    setSending(true);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    request.current = xhr;
    xhr.open("POST", "/api/enquiries");
    xhr.timeout = 60000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setSending(false);
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status < 200 || xhr.status >= 300)
          throw new Error(result.error || "Your request could not be saved.");
        setReceipt(result);
        window.scrollTo({ top: 0, behavior: "auto" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Please try again.");
      }
    };
    xhr.onerror = () => {
      setSending(false);
      setError(
        "We could not reach the enquiry service. Your details are still here. Please try again.",
      );
    };
    xhr.ontimeout = () => {
      setSending(false);
      setError("Saving took too long. Please retry; the same request will not be saved twice.");
    };
    xhr.send(form);
  }
  if (receipt)
    return (
      <PageShell>
        <section className="section wrap">
          <div className="success-box">
            <CheckCircle2 size={35} color="#173d71" />
            <span className="eyebrow">YOUR LOCAL PREVIEW REQUEST</span>
            <h1 style={{ fontSize: "clamp(42px,5vw,65px)", margin: "18px 0" }}>
              Your ideas, brought together.
            </h1>
            <p className="reference">{receipt.reference}</p>
            <p>
              Your brief and{" "}
              {files.length
                ? `${files.length} attachment${files.length > 1 ? "s" : ""}`
                : "project details"}{" "}
              have been saved in this local preview.{" "}
              <strong>No email or WhatsApp message has been sent.</strong>
            </p>
            <p>
              You can download your brief, or open WhatsApp and send it yourself. Floor plans are
              not automatically attached to WhatsApp.
            </p>
            <div className="success-actions">
              <button className="button" onClick={download}>
                Download my brief <Download size={17} />
              </button>
              <a
                className="button secondary"
                href={`${business.whatsapp}?text=${encodeURIComponent(summary())}`}
                target="_blank"
                rel="noreferrer"
              >
                Open brief in WhatsApp
              </a>
              <Link to="/design-ideas" className="text-link">
                Keep exploring <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    );
  return (
    <PageShell>
      <div className="wrap page-heading">
        <span className="eyebrow">A LITTLE ABOUT YOUR SPACE. A LOT OF POSSIBILITIES.</span>
        <h1>
          Let’s plan <em>your space.</em>
        </h1>
        <p>
          Start with what you know. We’ll bring your rooms, ideas, and requirements into one clear
          brief. No floor plan? You can still begin.
        </p>
      </div>
      <div className="wrap planner-layout">
        <div className="planner-main">
          <ol className="planner-steps" aria-label="Project planning progress">
            {steps.map((s, i) => (
              <li key={s} aria-current={step === i ? "step" : undefined}>
                <span>{i < step ? "✓" : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <form className="planner-panel" onSubmit={submit} noValidate>
            <span className="eyebrow">STEP {step + 1} OF 5</span>
            <h2 ref={title} tabIndex={-1}>
              {
                [
                  "Tell us about your home.",
                  "Make room for what matters.",
                  "What feels like you?",
                  "The practical details.",
                  "Your brief, all together.",
                ][step]
              }
            </h2>
            <p>
              {
                [
                  "A few basics help us understand your project.",
                  "Choose the rooms, then the work you need in each.",
                  "A direction is enough. Every choice can be discussed.",
                  "Share a floor plan if you have one, then tell us your comfort zone.",
                  "Check the details and choose how you would like to be contacted.",
                ][step]
              }
            </p>
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            {step === 0 && (
              <div className="field-grid">
                <label className="field-label">
                  Service area
                  <select
                    className="form-input"
                    value={draft.region}
                    onChange={(e) => set("region", e.target.value)}
                  >
                    {[...business.areas, "Other / please confirm"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  City / locality *
                  <input
                    className="form-input"
                    autoComplete="address-level2"
                    maxLength={160}
                    placeholder="e.g. Lucknow, Gomti Nagar"
                    value={draft.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Property type
                  <select
                    className="form-input"
                    value={draft.property}
                    onChange={(e) => set("property", e.target.value)}
                  >
                    {["Apartment", "Independent home", "Other"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Approximate carpet area (sq ft)
                  <input
                    className="form-input"
                    inputMode="decimal"
                    maxLength={12}
                    placeholder="Optional — leave blank if unsure"
                    value={draft.area}
                    onChange={(e) => set("area", e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Home configuration
                  <select
                    className="form-input"
                    value={draft.configuration}
                    onChange={(e) => set("configuration", e.target.value)}
                  >
                    {["Not sure", "Studio", "1 BHK", "2 BHK", "3 BHK", "4+ BHK", "Other"].map(
                      (x) => (
                        <option key={x}>{x}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="field-label">
                  Site readiness
                  <select
                    className="form-input"
                    value={draft.readiness}
                    onChange={(e) => set("readiness", e.target.value)}
                  >
                    {[
                      "To discuss",
                      "Keys received / ready",
                      "Awaiting possession",
                      "Currently occupied",
                      "Work already underway",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <div className="field-wide">
                  <p className="choice-group-title">What stage is your home at?</p>
                  <div className="choice-group">
                    {["New home", "Renovation"].map((x) => (
                      <Choice
                        key={x}
                        label={x}
                        selected={draft.condition === x}
                        onClick={() => set("condition", x)}
                      />
                    ))}
                  </div>
                </div>
                {draft.region === "Other / please confirm" && (
                  <p className="notice field-wide">
                    Our current service areas are Uttar Pradesh, Delhi NCR, and Bengaluru.
                    Availability elsewhere will need confirmation.
                  </p>
                )}
              </div>
            )}
            {step === 1 && (
              <>
                <div className="choice-group">
                  {["Whole home", "Selected rooms", "Help me decide"].map((x) => (
                    <Choice
                      key={x}
                      label={x}
                      selected={draft.scope === x}
                      onClick={() => set("scope", x)}
                    />
                  ))}
                </div>
                <p className="choice-group-title">Which spaces are we considering? *</p>
                <div className="choice-group">
                  {rooms.map((r) => (
                    <Choice
                      key={r}
                      label={r}
                      selected={draft.rooms.includes(r)}
                      onClick={() => selectRoom(r)}
                    />
                  ))}
                </div>
                {draft.scope === "Help me decide" ? (
                  <p className="notice">
                    We’ll use your selected spaces as a starting point and discuss the work with
                    you.
                  </p>
                ) : (
                  draft.rooms.map((r) => (
                    <div className="room-work" key={r}>
                      <h3>{r}</h3>
                      <div className="choice-group">
                        {workOptions.map((w) => (
                          <Choice
                            key={w}
                            label={w}
                            selected={!!draft.work[r]?.includes(w)}
                            onClick={() => selectWork(r, w)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
                <p className="fine-print">
                  These choices describe your request. Scope and feasibility are confirmed after
                  review.
                </p>
                {draft.rooms.length > 0 && (
                  <section className="phase-planner" aria-labelledby="phase-title">
                    <span className="eyebrow">ROOM FOR A LITTLE FORWARD THINKING</span>
                    <h3 id="phase-title">What comes first?</h3>
                    <p>
                      Tell us which rooms matter most now and which could wait. Unsure? Leave the
                      decision open.
                    </p>
                    <div className="phase-rooms">
                      {draft.rooms.map((room) => (
                        <label className="field-label" key={room}>
                          {room} priority
                          <select
                            className="form-input"
                            value={draft.roomPriorities[room] || "Discuss with designer"}
                            onChange={(e) =>
                              set("roomPriorities", {
                                ...draft.roomPriorities,
                                [room]: e.target.value,
                              })
                            }
                          >
                            {roomPriorityOptions.map((priority) => (
                              <option key={priority}>{priority}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <p className="fine-print">
                      These are your preferences, not a work schedule. Shared electrical, plumbing
                      and finishing work may need to happen together; sequencing needs a designer’s
                      review.
                    </p>
                  </section>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <div className="style-grid">
                  {[
                    ["Warm minimal", warm],
                    ["Modern classic", classic],
                    ["Natural & relaxed", natural],
                  ].map(([style, img]) => (
                    <button
                      key={style}
                      type="button"
                      className="style-choice"
                      aria-pressed={draft.style === style}
                      onClick={() => set("style", style)}
                    >
                      <img src={img} alt={`${style} interior direction`} />
                      <span>{style}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <Choice
                    label="Help me choose"
                    selected={draft.style === "Help me choose"}
                    onClick={() => set("style", "Help me choose")}
                  />
                </div>
                <p className="choice-group-title">What should your home do better?</p>
                <div className="choice-group">
                  {[
                    "More storage",
                    "Easy upkeep",
                    "Family time",
                    "Work from home",
                    "Better use of space",
                  ].map((p) => (
                    <Choice
                      key={p}
                      label={p}
                      selected={draft.priorities.includes(p)}
                      onClick={() =>
                        set(
                          "priorities",
                          draft.priorities.includes(p)
                            ? draft.priorities.filter((x) => x !== p)
                            : [...draft.priorities, p],
                        )
                      }
                    />
                  ))}
                </div>
                <p className="choice-group-title">Your saved inspiration</p>
                {inspirations.length ? (
                  <div className="inspiration-chips">
                    {inspirations.map((i) => (
                      <span className="inspiration-chip" key={i.id}>
                        {i.title}
                        <button
                          type="button"
                          aria-label={`Remove ${i.title}`}
                          onClick={() => {
                            saveInspiration(i);
                            setInspirations(readInspiration());
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12 }}>
                    Nothing saved yet. You can still continue, or{" "}
                    <Link to="/design-ideas" className="text-link">
                      explore the collection
                    </Link>
                    .
                  </p>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <label className="upload-zone">
                  <Upload size={27} strokeWidth={1.3} />
                  <strong style={{ fontSize: 14, marginTop: 12 }}>
                    Add your floor plan or room photos
                  </strong>
                  <p>Optional · PDF, JPG, PNG · Up to 3 files, 10 MB each</p>
                  <input
                    type="file"
                    aria-label="Floor plan or room photos"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                {files.map((f, i) => (
                  <div className="file-row" key={`${f.name}-${i}`}>
                    <FileText size={16} />
                    <span>
                      {f.name} · {(f.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      Remove
                    </button>
                  </div>
                ))}
                <p className="fine-print">
                  Files are saved privately when you submit. Attachments and contact details are not
                  retained in your browser after you leave this page.
                </p>
                <div className="field-grid" style={{ marginTop: 25 }}>
                  <label className="field-label">
                    Comfortable budget range
                    <select
                      className="form-input"
                      value={draft.budget}
                      onChange={(e) => set("budget", e.target.value)}
                    >
                      {[
                        "Need guidance",
                        "Under ₹5 lakh",
                        "₹5–10 lakh",
                        "₹10–20 lakh",
                        "₹20 lakh+",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <small>This is your budget preference, not an estimated price.</small>
                  </label>
                  <label className="field-label">
                    When would you like to begin?
                    <select
                      className="form-input"
                      value={draft.timing}
                      onChange={(e) => set("timing", e.target.value)}
                    >
                      {[
                        "Exploring ideas",
                        "Within 1 month",
                        "1–3 months",
                        "3–6 months",
                        "Later",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label field-wide">
                    Anything else we should know?
                    <textarea
                      className="form-input"
                      rows={3}
                      maxLength={2000}
                      placeholder="Your must-haves, practical needs, or questions…"
                      value={draft.notes}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </label>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div className="review-block">
                  <button
                    type="button"
                    aria-label="Edit your space"
                    disabled={sending}
                    onClick={() => go(0)}
                  >
                    Edit
                  </button>
                  <strong>Your space</strong>
                  {draft.city}, {draft.region} · {draft.property} · {draft.condition}
                  {draft.area && ` · ${draft.area} sq ft`}
                  <p>
                    {draft.configuration} · {draft.readiness}
                  </p>
                </div>
                <div className="review-block">
                  <button
                    type="button"
                    aria-label="Edit rooms and priorities"
                    disabled={sending}
                    onClick={() => go(1)}
                  >
                    Edit
                  </button>
                  <strong>{draft.scope}</strong>
                  {draft.rooms.map((r) => (
                    <p key={r}>
                      {r}: {(draft.work[r] || []).join(", ") || "Please advise"}
                      <span className="review-priority">
                        {draft.roomPriorities[r] || "Discuss with designer"}
                      </span>
                    </p>
                  ))}
                </div>
                <div className="review-block">
                  <button
                    type="button"
                    aria-label="Edit your direction"
                    disabled={sending}
                    onClick={() => go(2)}
                  >
                    Edit
                  </button>
                  <strong>Your direction</strong>
                  {draft.style} · {draft.priorities.join(", ") || "Priorities to discuss"}
                  {inspirations.length > 0 && <p>{inspirations.length} saved design references</p>}
                </div>
                <div className="review-block">
                  <button
                    type="button"
                    aria-label="Edit budget and timing"
                    disabled={sending}
                    onClick={() => go(3)}
                  >
                    Edit
                  </button>
                  <strong>Budget & timing</strong>
                  {draft.budget} · {draft.timing}
                  <p>
                    {files.length} attachment{files.length !== 1 ? "s" : ""}
                  </p>
                  {draft.notes && <p className="review-notes">Your notes: {draft.notes}</p>}
                </div>
                <div className="field-grid" style={{ marginTop: 28 }}>
                  <label className="field-label">
                    Your name *
                    <input
                      className="form-input"
                      autoComplete="name"
                      value={draft.name}
                      maxLength={100}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Mobile number *
                    <input
                      className="form-input"
                      autoComplete="tel"
                      type="tel"
                      value={draft.phone}
                      maxLength={25}
                      placeholder="10-digit mobile number"
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Email {draft.method === "Email" ? "*" : "(optional)"}
                    <input
                      className="form-input"
                      autoComplete="email"
                      type="email"
                      value={draft.email}
                      maxLength={254}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Preferred contact
                    <select
                      className="form-input"
                      value={draft.method}
                      onChange={(e) => set("method", e.target.value)}
                    >
                      {["Phone", "WhatsApp", "Email"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label field-wide">
                    Preferred callback time
                    <select
                      className="form-input"
                      value={draft.time}
                      onChange={(e) => set("time", e.target.value)}
                    >
                      {[
                        "Any time",
                        "Morning · 10am–12pm",
                        "Afternoon · 12pm–4pm",
                        "Evening · 4pm–7pm",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <small>A preference, not a confirmed appointment.</small>
                  </label>
                </div>
                <label style={{ display: "none" }} aria-hidden="true">
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={draft.website}
                    onChange={(e) => set("website", e.target.value)}
                  />
                </label>
                <label className="consent-label">
                  <input
                    type="checkbox"
                    checked={draft.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                  />
                  <span>
                    I agree to my project and contact details being used to respond to this enquiry.{" "}
                    <Link to="/privacy" target="_blank" className="text-link">
                      Privacy information
                    </Link>
                  </span>
                </label>
                <div className="notice">
                  This is a private preview. Submitting saves your brief on this computer; it does
                  not send an email to the studio.
                </div>
              </>
            )}
            <div className="planner-controls">
              {step > 0 ? (
                <button
                  type="button"
                  className="text-link"
                  disabled={sending}
                  onClick={() => go(step - 1)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <span className="fine-print" style={{ margin: 0 }}>
                  No account needed.
                </span>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  key="continue"
                  className="button"
                  onClick={(e) => {
                    e.preventDefault();
                    next();
                  }}
                >
                  Continue <ArrowRight size={17} />
                </button>
              ) : (
                <button key="submit" type="submit" className="button" disabled={sending}>
                  {sending ? `Saving… ${progress}%` : "Save preview request"}{" "}
                  {!sending && <ArrowRight size={17} />}
                </button>
              )}
            </div>
            {sending && (
              <progress
                aria-label="Upload progress"
                value={progress}
                max={100}
                style={{ width: "100%", marginTop: 12 }}
              />
            )}
          </form>
        </div>
        <aside className="planner-summary">
          <span className="eyebrow">THE BIG PICTURE</span>
          <h3>Your space brief.</h3>
          <div className="summary-row">
            <span>Location</span>
            {draft.city || "Your city"}, {draft.region}
          </div>
          <div className="summary-row">
            <span>Your home</span>
            {draft.property} · {draft.condition}
          </div>
          <div className="summary-row">
            <span>Scope</span>
            {draft.scope}
            <ul>
              {draft.rooms.map((r) => (
                <li key={r}>
                  — {r}
                  {draft.roomPriorities[r] &&
                    draft.roomPriorities[r] !== "Discuss with designer" && (
                      <small className="summary-priority">{draft.roomPriorities[r]}</small>
                    )}
                </li>
              ))}
            </ul>
          </div>
          <div className="summary-row">
            <span>Design direction</span>
            {draft.style}
          </div>
          <div className="summary-row">
            <span>Budget preference</span>
            {draft.budget}
          </div>
          <div className="summary-row">
            <span>Inspiration & plans</span>
            {inspirations.length} saved ideas · {files.length} files
          </div>
          <p className="summary-foot">
            A thoughtful estimate starts with your requirements. Final scope, measurements, and
            material choices are reviewed with you.
          </p>
          <a href={business.phoneHref} className="text-link">
            Prefer to talk? {business.phone}
          </a>
        </aside>
      </div>
    </PageShell>
  );
}
