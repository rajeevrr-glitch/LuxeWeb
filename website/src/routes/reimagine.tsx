import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Download,
  Sparkles,
  Check,
  Ruler,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { rooms } from "@/lib/business";
import { saveRoomBrief } from "@/lib/visualiser-brief";
import { approximateArea, convertDimension } from "@/lib/room-dimensions";
import { RoomFitPlanner } from "@/components/RoomFitPlanner";
import { PhotoAreaSelector, type EditArea } from "@/components/PhotoAreaSelector";
import { openWhatsAppRequest } from "@/lib/whatsapp";
import "@/room-planner.css";
import roomHero from "@/assets/hero-living.jpg";
import classicRoom from "@/assets/living.jpg";
import naturalRoom from "@/assets/ideas/living/06.jpg";
import calmBedroom from "@/assets/ideas/bedroom/04.jpg";

export const Route = createFileRoute("/reimagine")({
  head: () => ({
    meta: [
      { title: "Reimagine your room — LuxeInfra" },
      {
        name: "description",
        content:
          "Start with a room photo, describe your ideas, and prepare a personal interior design concept.",
      },
    ],
  }),
  component: Reimagine,
});
type Status = {
  enabled: boolean;
  provider: "gemini" | "openai" | "huggingface";
  providerLabel: string;
  remaining: number;
  message: string;
  captureAvailable?: boolean;
};
type Job = {
  id: string;
  state: "generating" | "completed" | "failed";
  error?: string;
  original?: string;
  concept?: string;
  expiresAt: number;
};
const styles = ["Warm minimal", "Modern classic", "Natural & relaxed", "Help me choose"];
const styleImages = [calmBedroom, classicRoom, naturalRoom];
const styleNotes = [
  "Soft neutrals · clean lines · quiet comfort",
  "Elegant details · balanced forms · timeless finishes",
  "Natural textures · earthy tones · easy living",
  "Keep the direction open for our designer",
];
const ideaStarters = [
  ["More storage", "Add concealed storage to keep everyday clutter out of sight."],
  ["Warmer lighting", "Use layered warm lighting for relaxing evenings."],
  ["A reading corner", "Create a comfortable reading corner with a lamp and a small shelf."],
  ["Easy upkeep", "Prioritise practical finishes and furniture that are easy to clean."],
];
const changeOptions = [
  { id: "furniture", label: "Furniture & storage" },
  { id: "walls", label: "Walls & finishes" },
  { id: "lighting", label: "Lighting" },
  { id: "flooring", label: "Flooring" },
  { id: "decor", label: "Decor" },
];
async function jsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Please try again later.");
  return body;
}
async function imageFile(url: string, name: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("This image has expired. Please start a new brief.");
  return new File([await response.blob()], name, { type: "image/jpeg" });
}
function Reimagine() {
  const [mode, setMode] = useState<"restyle" | "fit">("restyle");
  const [requestedChanges, setRequestedChanges] = useState<string[]>([]);
  const [preserve, setPreserve] = useState<string[]>(["flooring"]);
  const [editArea, setEditArea] = useState<EditArea>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status | null>(null);
  const [serviceError, setServiceError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [brief, setBrief] = useState({
    room: "Living & dining",
    style: "Warm minimal",
    length: "",
    width: "",
    height: "",
    unit: "feet",
    changes: "",
    keep: "",
  });
  const [review, setReview] = useState(false);
  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", city: "" });
  const [contactConsent, setContactConsent] = useState(false);
  const [contactReference, setContactReference] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const contactRequest = useRef<{ id: string; payload: string } | null>(null);
  const contactLocked = useRef(false);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [split, setSplit] = useState(50);
  const [pollVersion, setPollVersion] = useState(0);
  const [uncertainId, setUncertainId] = useState("");
  const locked = useRef(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const photoVersion = useRef(0);
  const photoInput = useRef<HTMLInputElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const generationError = useRef<HTMLDivElement>(null);
  const update = (key: keyof typeof brief, value: string) =>
    setBrief((b) => ({ ...b, [key]: value }));
  function changeUnit(unit: string) {
    setBrief((b) => ({
      ...b,
      unit,
      length: convertDimension(b.length, b.unit, unit),
      width: convertDimension(b.width, b.unit, unit),
      height: convertDimension(b.height, b.unit, unit),
    }));
  }
  function addIdea(text: string) {
    if (brief.changes.includes(text)) return;
    const next = [brief.changes.trim(), text].filter(Boolean).join("\n");
    if (next.length > 1000) {
      setError("Your description is full. Edit it before adding another idea.");
      return;
    }
    update("changes", next);
    setError("");
  }
  function downloadBrief() {
    const url = URL.createObjectURL(
      new Blob(
        [
          "LuxeInfra — My room brief\n\n" +
            notes() +
            "\n\nThis is a design brief, not a quote or measured drawing.\nPhoto: " +
            (photo?.name || "Not attached") +
            " (the photo is not included in this text file).",
        ],
        { type: "text/plain;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "LuxeInfra-my-room-brief.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function choosePhoto(file?: File) {
    if (!file) return;
    const version = ++photoVersion.current;
    setPhoto(null);
    setError("");
    setEditArea(undefined);
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      !file.size ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Choose a JPG or PNG room photo up to 8 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const valid =
        bitmap.width >= 256 && bitmap.height >= 256 && bitmap.width * bitmap.height <= 40_000_000;
      bitmap.close();
      if (version !== photoVersion.current) return;
      if (!valid) {
        setError(
          "Choose a photo at least 256 pixels on each side and no larger than 40 megapixels.",
        );
        return;
      }
      setPhoto(file);
    } catch {
      if (version === photoVersion.current)
        setError("This photo could not be opened. Try another JPG or PNG.");
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/visualiser/status", { signal: controller.signal })
      .then(jsonResponse<Status>)
      .then(setStatus)
      .catch(() => {
        if (!controller.signal.aborted)
          setServiceError("The image service is unavailable. You can still prepare a room brief.");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    if (review) reviewHeading.current?.focus();
  }, [review]);
  useEffect(() => {
    if (error) errorMessage.current?.focus();
  }, [error]);
  const jobId = job?.id;
  const jobState = job?.state;
  useEffect(() => {
    if (jobState === "failed") generationError.current?.focus();
  }, [jobState]);
  useEffect(() => {
    if (!jobId || jobState !== "generating") return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await fetch(`/api/visualiser/jobs/${jobId}`, {
          signal: controller.signal,
        }).then(jsonResponse<Job>);
        if (controller.signal.aborted) return;
        setJob(result);
        if (result.state === "generating") timer = setTimeout(poll, 2000);
      } catch {
        if (!controller.signal.aborted)
          setError(
            "We couldn’t check the result. Check its status below before starting another attempt.",
          );
      }
    }
    timer = setTimeout(poll, 1000);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [jobId, jobState, pollVersion]);
  function validate() {
    if (!photo) return "Choose a room photo first.";
    if (
      !["image/jpeg", "image/png"].includes(photo.type) ||
      photo.size > 8 * 1024 * 1024 ||
      !photo.size
    )
      return "Choose a JPG or PNG room photo up to 8 MB.";
    const max = brief.unit === "feet" ? [100, 100, 30] : [30.48, 30.48, 9.144];
    const min = brief.unit === "feet" ? 1 : 0.3048;
    if (!!brief.length.trim() !== !!brief.width.trim())
      return "Add both room length and width, or leave them both blank.";
    if (
      [brief.length, brief.width, brief.height].some(
        (v, i) =>
          v.trim() && (!Number.isFinite(Number(v)) || Number(v) < min || Number(v) > max[i]),
      )
    )
      return `Enter room dimensions between ${min} and ${max[0]} ${brief.unit}, and ceiling height between ${min} and ${max[2]} ${brief.unit}.`;
    if (!requestedChanges.length && brief.changes.trim().length < 10)
      return "Choose something to change or describe your ideas in at least 10 characters.";
    return "";
  }
  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contactLocked.current || savingContact || contactReference || !contactConsent) return;
    const digits = contact.phone.replace(/[\s()-]/g, "");
    if (
      contact.name.trim().length < 2 ||
      contact.city.trim().length < 2 ||
      !/^(?:\+?91)?[6-9]\d{9}$/.test(digits)
    ) {
      setError("Add your name, a valid Indian mobile number and your city.");
      return;
    }
    setSavingContact(true);
    contactLocked.current = true;
    setError("");
    const payload = JSON.stringify({
      ...contact,
      room: brief.room,
      style: brief.style,
      consent: true,
      website: "",
    });
    if (contactRequest.current?.payload !== payload)
      contactRequest.current = { id: crypto.randomUUID(), payload };
    try {
      const saved = await fetch("/api/visualiser/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactRequest.current.id, ...JSON.parse(payload) }),
        signal: AbortSignal.timeout(15000),
      }).then(jsonResponse<{ reference: string; state: string }>);
      if (saved.state !== "saved_locally" || !/^LR-[A-F0-9]{16}$/.test(saved.reference))
        throw new Error("We could not confirm your details. Please try saving them again.");
      setContactReference(saved.reference);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "We could not save your details. No concept was started.",
      );
    } finally {
      contactLocked.current = false;
      setSavingContact(false);
    }
  }
  function sendRoomRequest() {
    openWhatsAppRequest(
      [
        "Hello LuxeInfra, I’d like to discuss my room design.",
        `Name: ${contact.name.trim()}`,
        `Mobile: ${contact.phone.trim()}`,
        `City: ${contact.city.trim()}`,
        `Room: ${brief.room} · ${brief.style}`,
        `Room enquiry reference: ${contactReference}`,
        "I agree to be contacted about this room design request.",
        "I’ll attach my room photo in this chat.",
      ].join("\n"),
    );
  }
  async function generate() {
    if (
      locked.current ||
      job ||
      uncertainId ||
      !consent ||
      !contactReference ||
      !status?.enabled ||
      !status.remaining
    )
      return;
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    const id = crypto.randomUUID();
    const data = new FormData();
    data.append(
      "brief",
      JSON.stringify({
        ...brief,
        id,
        length: brief.length.trim() ? Number(brief.length) : undefined,
        width: brief.width.trim() ? Number(brief.width) : undefined,
        height: brief.height.trim() ? Number(brief.height) : undefined,
        changes: [
          requestedChanges.length
            ? `Update ${changeOptions
                .filter((c) => requestedChanges.includes(c.id))
                .map((c) => c.label.toLowerCase())
                .join(", ")} in the selected style.`
            : "",
          brief.changes.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
        requestedChanges,
        preserve,
        editArea,
        consent,
        provider: status.provider,
      }),
    );
    data.append("photo", photo!);
    try {
      const response = await fetch("/api/visualiser/jobs", { method: "POST", body: data });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error || "The request could not start.");
        return;
      }
      setJob(await jsonResponse<Job>(response));
      setStatus((s) => (s ? { ...s, remaining: Math.max(0, s.remaining - 1) } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start the concept.");
      // A lost response may still represent a paid generation. Never automatically retry.
      setUncertainId(id);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function recover() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/visualiser/jobs/${uncertainId}`);
      if (response.status === 404) {
        setUncertainId("");
        setError(
          "No active result was found. It may have expired. No new generation was started; check your account usage before trying again.",
        );
        setStatus(await fetch("/api/visualiser/status").then(jsonResponse<Status>));
        return;
      }
      setJob(await jsonResponse<Job>(response));
      setUncertainId("");
    } catch (e) {
      setError(
        `${e instanceof Error ? e.message : "Status unavailable."} No new generation was requested.`,
      );
    } finally {
      setBusy(false);
    }
  }
  function notes() {
    return [
      `ROOM DESIGN BRIEF`,
      `${brief.room} · ${brief.style}`,
      brief.length && brief.width
        ? `Optional dimensions: ${brief.length} × ${brief.width} ${brief.unit}${brief.height ? `; ceiling ${brief.height} ${brief.unit}` : ""}. Not a verified layout.`
        : "Room dimensions not supplied; this is photo restyling only.",
      requestedChanges.length
        ? `Selected changes: ${changeOptions
            .filter((c) => requestedChanges.includes(c.id))
            .map((c) => c.label)
            .join(", ")}.`
        : "",
      `Retain: room structure, openings, viewpoint${preserve.length ? `, existing ${preserve.join(" and ")}` : ""}.`,
      editArea
        ? "A photo area was marked for edit guidance, not a hard mask or measured boundary."
        : "",
      `Ideas: ${brief.changes.trim()}`,
      brief.keep.trim() ? `Keep: ${brief.keep.trim()}` : "",
      job?.state === "completed"
        ? "Attached AI-generated concept is inspiration only. Dimensions, layout, materials, cost and feasibility need designer verification."
        : "No AI concept generated. Please review the attached room photo and requirements.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  async function handoff() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const files =
        job?.state === "completed"
          ? await Promise.all([
              imageFile(job.original!, "My-room.jpg"),
              imageFile(job.concept!, "AI-concept-inspiration-only.jpg"),
            ])
          : [photo!];
      saveRoomBrief({ room: brief.room, style: brief.style, notes: notes(), files });
      await navigate({ to: "/project-brief", search: { roomBrief: "1" } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function download() {
    setError("");
    try {
      const file = await imageFile(job!.concept!, "LuxeInfra-AI-concept.jpg");
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download unavailable.");
    }
  }
  async function reset() {
    setBusy(true);
    setError("");
    try {
      if (job) {
        const response = await fetch(`/api/visualiser/jobs/${job.id}`, { method: "DELETE" });
        if (response.status !== 404 && response.status !== 401) await jsonResponse(response);
      }
      setJob(null);
      setUncertainId("");
      setReview(false);
      setConsent(false);
      setStatus(await fetch("/api/visualiser/status").then(jsonResponse<Status>));
    } catch {
      setError(
        "Could not clear the previous concept. Please check again before generating another.",
      );
    } finally {
      setBusy(false);
    }
  }
  const generating = job?.state === "generating";
  const area = approximateArea(brief.length, brief.width);
  return (
    <PageShell>
      <section className="wrap section reimagine-intro">
        <div className="reimagine-hero-copy">
          <span className="eyebrow">
            <span className="tiny-line" /> THE LUXEINFRA DESIGN STUDIO
          </span>
          <h1>
            Your room.
            <br />
            <em>A whole new</em>
            <br />
            <em>feeling.</em>
          </h1>
          <p>
            Explore a fresh look for your room, or arrange furniture in a scaled plan. Two ways to
            take the next step, with your own space at the centre.
          </p>
          <div className="reimagine-hero-actions">
            <a className="button" href="#room-tools">
              Start with my room <Camera size={18} />
            </a>
            <Link className="text-link" to="/design-ideas">
              A little inspiration <ArrowRight size={16} />
            </Link>
          </div>
          <p className="reimagine-hero-note">
            Your photo. Your ideas. A brief that feels like you.
          </p>
        </div>
        <figure className="reimagine-editorial">
          <img
            className="reimagine-cover"
            src={roomHero}
            alt="Interior inspiration: a warm living room with sculptural furniture"
            width="1920"
            height="1080"
            fetchPriority="high"
          />
          <div className="reimagine-inset">
            <img
              src={calmBedroom}
              alt="Interior inspiration: a quiet bedroom with natural materials"
              width="1024"
              height="768"
            />
            <span>SOFT LIGHT. SLOW MORNINGS.</span>
          </div>
          <div className="reimagine-materials">
            <span className="eyebrow">THE FEELING</span>
            <span className="material-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <em>
              Warm. Personal.
              <br />
              Perfectly yours.
            </em>
          </div>
          <figcaption>STYLE INSPIRATION · NOT AN AI-GENERATED RESULT</figcaption>
        </figure>
      </section>
      <div
        className="wrap room-tool-choice"
        id="room-tools"
        role="group"
        aria-label="Choose your room studio tool"
      >
        <button type="button" aria-pressed={mode === "restyle"} onClick={() => setMode("restyle")}>
          <Camera size={25} />
          <strong>Restyle my room</strong>
          <span>Your photo, a fresh direction. Choose what changes and what stays.</span>
        </button>
        <button type="button" aria-pressed={mode === "fit"} onClick={() => setMode("fit")}>
          <Ruler size={25} />
          <strong>Plan what fits</strong>
          <span>A scaled top view. Move furniture and check the space around it.</span>
        </button>
      </div>
      <div className={mode === "fit" ? "" : "room-studio-hidden"}>
        <RoomFitPlanner />
      </div>
      <div className={mode === "restyle" ? "" : "room-studio-hidden"}>
        <div className="wrap reimagine-journey">
          <span className="eyebrow">
            A LITTLE IMAGINATION.
            <br />A CLEAR NEXT STEP.
          </span>
          <ol className="ai-steps">
            <li aria-current={!review ? "step" : undefined}>
              <span>01</span> Share your space
            </li>
            <li aria-current={review && job?.state !== "completed" ? "step" : undefined}>
              <span>02</span> Shape the idea
            </li>
            <li aria-current={job?.state === "completed" ? "step" : undefined}>
              <span>03</span> Bring it to your brief
            </li>
          </ol>
        </div>
        <section className="wrap ai-workspace" id="room-studio" aria-label="Room visualiser">
          <aside className="ai-photo-panel">
            <div className={`ai-photo ${preview ? "has-room-photo" : "has-style-reference"}`}>
              {preview ? (
                <PhotoAreaSelector
                  src={preview}
                  area={editArea}
                  onChange={setEditArea}
                  disabled={review || busy || !!job}
                />
              ) : (
                <>
                  <img
                    src={styleImages[styles.indexOf(brief.style)] || calmBedroom}
                    alt={`${brief.style} interior inspiration, not your room or an AI result`}
                    loading="lazy"
                  />
                  <div className="ai-reference-caption">
                    <span>YOUR DESIGN DIRECTION</span>
                    <h2>
                      {brief.style === "Help me choose" ? "Room for possibility." : brief.style}
                    </h2>
                  </div>
                </>
              )}
              <span className="ai-photo-tag">
                {preview ? "YOUR ORIGINAL PHOTO" : "STYLE REFERENCE"}
              </span>
            </div>
            <div className="ai-photo-caption">
              <span className="eyebrow">
                {preview ? "THE SPACE WE’LL START WITH" : "START WITH A FEELING"}
              </span>
              <p>
                {preview
                  ? "Your photograph stays here while you shape the brief. We’ll carry it into your project when you’re ready."
                  : "Choose a direction that draws you in. Then add your own room photo to make the brief personal. This reference is inspiration, not a generated result."}
              </p>
              <details className="ai-photo-guide">
                <summary>A better photo, a better starting point</summary>
                <ul>
                  <li>Stand in a corner and use the normal 1× camera lens.</li>
                  <li>Take the photo in daylight, with curtains open.</li>
                  <li>Show the room’s corners and fixed doors or windows.</li>
                  <li>Remove personal documents and avoid including people.</li>
                </ul>
              </details>
              {photo && (
                <p className="ai-file-detail">
                  {photo.name} · {(photo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </aside>
          <div className="ai-form-panel">
            <div className="ai-status" role="status">
              <Sparkles size={18} />
              <p>{serviceError || status?.message || "Checking image service…"}</p>
            </div>
            {!review ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const message = validate();
                  setError(message);
                  if (!message) setReview(true);
                }}
              >
                <span className="eyebrow">YOUR ROOM. YOUR CHOICES.</span>
                <h2>
                  Let’s make it <em>yours.</em>
                </h2>
                <div className="ai-section-label">
                  <span>01</span> The space you have
                </div>
                <label className="ai-upload-zone">
                  <input
                    type="file"
                    aria-label="Your room photo"
                    ref={photoInput}
                    accept="image/jpeg,image/png"
                    required={!photo}
                    onChange={(e) => {
                      void choosePhoto(e.target.files?.[0]);
                    }}
                  />
                  <span className="ai-upload-icon">
                    <Camera size={25} strokeWidth={1.4} />
                  </span>
                  <span>
                    <strong>{photo ? "Change your room photo" : "Add a photo of your room"}</strong>
                    <small>JPG or PNG · up to 8 MB · 256px minimum</small>
                  </span>
                  <ArrowUpRight size={19} />
                </label>
                {photo && (
                  <button
                    type="button"
                    className="text-link ai-remove"
                    onClick={() => {
                      ++photoVersion.current;
                      setPhoto(null);
                      if (photoInput.current) photoInput.current.value = "";
                    }}
                  >
                    Remove selected photo
                  </button>
                )}
                <div className="ai-room-choice">
                  <label className="ai-field">
                    Which room?
                    <select value={brief.room} onChange={(e) => update("room", e.target.value)}>
                      {rooms.map((room) => (
                        <option key={room}>{room}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="ai-section-label">
                  <span>02</span> The feeling you’re after
                </div>
                <fieldset className="ai-style-picker">
                  <legend>How should it feel?</legend>
                  <div>
                    {styles.map((style, i) => (
                      <button
                        key={style}
                        type="button"
                        aria-pressed={brief.style === style}
                        onClick={() => update("style", style)}
                      >
                        {i < 3 ? (
                          <img
                            className="ai-style-image"
                            src={styleImages[i]}
                            alt=""
                            loading="lazy"
                            width="1024"
                            height="768"
                          />
                        ) : (
                          <span className="ai-style-open" aria-hidden="true">
                            <Sparkles size={30} strokeWidth={1} />
                            <em>
                              Let’s discover
                              <br />
                              your direction.
                            </em>
                          </span>
                        )}
                        <span className="ai-style-copy">
                          <strong>{style}</strong>
                          <small>{styleNotes[i]}</small>
                          <span className={`ai-swatches ai-swatches-${i}`} aria-hidden="true">
                            <i />
                            <i />
                            <i />
                          </span>
                        </span>
                        {brief.style === style && (
                          <span className="ai-style-check" aria-hidden="true">
                            <Check size={13} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="ai-section-label">
                  <span>03</span> What would you change?
                </div>
                <div className="restyle-options" role="group" aria-label="Features to change">
                  {changeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={requestedChanges.includes(option.id)}
                      onClick={() => {
                        const active = requestedChanges.includes(option.id);
                        setRequestedChanges(
                          active
                            ? requestedChanges.filter((c) => c !== option.id)
                            : [...requestedChanges, option.id],
                        );
                        if (!active) setPreserve(preserve.filter((p) => p !== option.id));
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="restyle-keep-note">
                  We’ll ask the image model to retain your room’s walls, doors, windows and
                  viewpoint. The concept remains visual inspiration, not a measured layout.
                </p>
                <div
                  className="restyle-options"
                  role="group"
                  aria-label="Existing finishes or furniture to retain"
                >
                  {["flooring", "furniture"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={preserve.includes(option)}
                      onClick={() => {
                        const active = preserve.includes(option);
                        setPreserve(
                          active ? preserve.filter((p) => p !== option) : [...preserve, option],
                        );
                        if (!active)
                          setRequestedChanges(requestedChanges.filter((c) => c !== option));
                      }}
                    >
                      Keep existing {option}
                    </button>
                  ))}
                </div>
                <details className="restyle-dimensions">
                  <summary>Add approximate measurements · optional</summary>
                  <p className="ai-fine">
                    These help our designer understand your brief. To check furniture sizes and
                    clearances, use Plan what fits.
                  </p>
                  <label className="ai-field">
                    Dimension unit
                    <select value={brief.unit} onChange={(e) => changeUnit(e.target.value)}>
                      <option value="feet">Feet</option>
                      <option value="metres">Metres</option>
                    </select>
                  </label>
                  <div className="ai-dimensions">
                    {(
                      [
                        ["length", "Length"],
                        ["width", "Width"],
                        ["height", "Ceiling height"],
                      ] as const
                    ).map(([key, label]) => (
                      <label className="ai-field" key={key}>
                        {label}
                        <input
                          type="number"
                          min={brief.unit === "feet" ? 1 : 0.3048}
                          max={
                            brief.unit === "feet"
                              ? key === "height"
                                ? 30
                                : 100
                              : key === "height"
                                ? 9.144
                                : 30.48
                          }
                          step="any"
                          inputMode="decimal"
                          value={brief[key]}
                          onChange={(e) => update(key, e.target.value)}
                          placeholder={
                            brief.unit === "feet"
                              ? key === "height"
                                ? "e.g. 9"
                                : "e.g. 12"
                              : key === "height"
                                ? "e.g. 2.7"
                                : "e.g. 3.6"
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p className="ai-area" aria-live="polite">
                    {area
                      ? `Approx. rectangular floor area: ${area} ${brief.unit === "feet" ? "sq ft" : "sq m"}.`
                      : "Measure wall to wall; ceiling height is from floor to ceiling."}{" "}
                    <span>Changing units converts the numbers already entered.</span>
                  </p>
                </details>
                <details className="restyle-dimensions">
                  <summary>A few ideas to get started · optional</summary>
                  <fieldset className="ai-idea-starters">
                    <legend>Need a starting point?</legend>
                    <div>
                      {ideaStarters.map(([label, text]) => (
                        <button
                          type="button"
                          key={label}
                          disabled={brief.changes.includes(text)}
                          onClick={() => addIdea(text)}
                        >
                          {brief.changes.includes(text) ? "✓ " : "+ "}
                          {label}
                        </button>
                      ))}
                    </div>
                    <p>Tap an idea to add it to your description. Your own words stay in place.</p>
                  </fieldset>
                </details>
                <label className="ai-field">
                  Anything specific? · optional after choosing a change
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={brief.changes}
                    onChange={(e) => update("changes", e.target.value)}
                    placeholder="A warm, uncluttered living room with concealed storage, soft lighting and a reading corner…"
                  />
                </label>
                <label className="ai-field">
                  What should stay? <span className="ai-optional">Optional</span>
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={brief.keep}
                    onChange={(e) => update("keep", e.target.value)}
                    placeholder="Keep the existing sofa, windows and flooring…"
                  />
                </label>
                <button className="button" type="submit">
                  Review my room concept <Check size={17} />
                </button>
                <p className="ai-fine">Selecting a photo does not send it to an AI service.</p>
              </form>
            ) : (
              <div>
                <span className="eyebrow">02 / YOUR DIRECTION</span>
                <h2 ref={reviewHeading} tabIndex={-1}>
                  A space, rethought.
                </h2>
                <dl className="ai-review">
                  <div>
                    <dt>Space & style</dt>
                    <dd>
                      {brief.room} · {brief.style}
                    </dd>
                  </div>
                  <div>
                    <dt>Dimensions you provided</dt>
                    <dd>
                      {brief.length && brief.width
                        ? `${brief.length} × ${brief.width} ${brief.unit}${brief.height ? ` · ceiling ${brief.height} ${brief.unit}` : ""}`
                        : "Not supplied · photo restyling only"}
                    </dd>
                  </div>
                  <div>
                    <dt>Your ideas</dt>
                    <dd>
                      {[
                        changeOptions
                          .filter((c) => requestedChanges.includes(c.id))
                          .map((c) => c.label)
                          .join(", "),
                        brief.changes,
                      ]
                        .filter(Boolean)
                        .join(". ")}
                    </dd>
                  </div>
                  {brief.keep && (
                    <div>
                      <dt>Keep in place</dt>
                      <dd>{brief.keep}</dd>
                    </div>
                  )}
                </dl>
                <p className="ai-fine">
                  AI concepts are visual inspiration. They may alter details or proportions;
                  dimensions do not guarantee an accurate layout or furniture fit. A designer must
                  verify the proposal.
                </p>
                {!job && !uncertainId && status?.captureAvailable && (
                  <div className="room-contact-card">
                    <div className="room-contact-heading">
                      <span>
                        <UserRound size={22} />
                      </span>
                      <div>
                        <span className="eyebrow">YOUR ROOM. YOUR NEXT STEP.</span>
                        <h3>Let’s put a name to your idea.</h3>
                      </div>
                    </div>
                    {contactReference ? (
                      <div className="room-contact-saved" role="status">
                        <strong>
                          <Check size={18} /> Details saved, {contact.name.trim().split(" ")[0]}.
                        </strong>
                        <p>
                          Your details are saved for this preview. Send the request to our studio on
                          WhatsApp; press Send there to reach us. Your photo is not attached
                          automatically.
                        </p>
                        <button type="button" className="button outline" onClick={sendRoomRequest}>
                          Discuss my room on WhatsApp
                        </button>
                        <small>Reference {contactReference}</small>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => {
                            setContactReference("");
                            setContactConsent(false);
                          }}
                        >
                          Edit my contact details
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={saveContact}>
                        <p>
                          Share three quick details before creating a concept. Our team can help
                          turn your inspiration into a workable design.
                        </p>
                        <div className="room-contact-fields">
                          <label className="ai-field">
                            Your name
                            <input
                              autoComplete="name"
                              name="room-name"
                              required
                              minLength={2}
                              maxLength={80}
                              value={contact.name}
                              onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                            />
                          </label>
                          <label className="ai-field">
                            Mobile number
                            <input
                              autoComplete="tel"
                              type="tel"
                              inputMode="tel"
                              name="room-phone"
                              required
                              maxLength={30}
                              placeholder="10-digit mobile"
                              value={contact.phone}
                              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                            />
                          </label>
                          <label className="ai-field">
                            Your city
                            <input
                              autoComplete="address-level2"
                              name="room-city"
                              required
                              minLength={2}
                              maxLength={100}
                              value={contact.city}
                              onChange={(e) => setContact((c) => ({ ...c, city: e.target.value }))}
                            />
                          </label>
                        </div>
                        <label className="ai-consent">
                          <input
                            type="checkbox"
                            checked={contactConsent}
                            required
                            onChange={(e) => setContactConsent(e.target.checked)}
                          />
                          <span>
                            I agree to LuxeInfra saving these details privately and contacting me
                            about my room design. <Link to="/privacy">Privacy notice</Link>
                          </span>
                        </label>
                        <button
                          className="button"
                          type="submit"
                          disabled={savingContact || !contactConsent}
                        >
                          {savingContact ? "Saving your details…" : "Save my details"}
                          <Check size={17} />
                        </button>
                        <small className="room-contact-privacy">
                          <ShieldCheck size={15} /> Contact details are not sent to the image
                          provider.
                        </small>
                      </form>
                    )}
                  </div>
                )}
                {!status?.enabled && (
                  <div className="ai-offline-next">
                    <strong>Your brief is ready for a designer.</strong>
                    <p>
                      AI concepts are paused for now. Continue to your project brief with this photo
                      and your ideas; our designer can help you take the next step.
                    </p>
                  </div>
                )}
                {!job && !uncertainId && status?.enabled && (
                  <>
                    <label className="ai-consent">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        disabled={!status?.enabled}
                      />
                      <span>
                        I have permission to use this photo and agree to send it, my room details
                        and instructions to{" "}
                        {status?.providerLabel || "the connected image provider"} to create a
                        concept. <Link to="/privacy">About my information</Link>
                      </span>
                    </label>
                    <button
                      className="button"
                      disabled={
                        busy ||
                        !consent ||
                        !contactReference ||
                        !status?.enabled ||
                        !status.remaining
                      }
                      onClick={generate}
                    >
                      <Sparkles size={18} />
                      {busy ? "Starting your concept…" : "Generate my room concept"}
                    </button>
                    {!status?.enabled && (
                      <p className="ai-fine">
                        Generation will become available when the studio connects an
                        image-generation account.
                      </p>
                    )}
                  </>
                )}
                {generating && (
                  <div className="ai-progress" role="status">
                    <Sparkles size={24} />
                    <h3>Your idea is taking shape.</h3>
                    <p>
                      This can take a few minutes. Keep this page open. We won’t start another
                      generation automatically.
                    </p>
                  </div>
                )}
                {job?.state === "failed" && (
                  <div role="alert" className="ai-error" tabIndex={-1} ref={generationError}>
                    <strong>We couldn’t create your concept.</strong>
                    <p>{job.error}</p>
                    <p>
                      Your photo and room details are still here. You can continue with our designer
                      below.
                    </p>
                  </div>
                )}
                {uncertainId && (
                  <button className="button" disabled={busy} onClick={recover}>
                    Check the existing request
                  </button>
                )}
                {generating && error && (
                  <button
                    className="text-link"
                    onClick={() => {
                      setError("");
                      setPollVersion((v) => v + 1);
                    }}
                  >
                    Check result again
                  </button>
                )}
                {!generating && (
                  <div className="ai-actions">
                    <button className="button outline" disabled={busy} onClick={handoff}>
                      {job?.state === "completed"
                        ? "Use this concept in my brief"
                        : "Add this room to my project brief"}
                      <ArrowRight size={17} />
                    </button>
                    <button className="text-link" disabled={busy} onClick={downloadBrief}>
                      <Download size={16} /> Save my room brief
                    </button>
                    {!job && !uncertainId && (
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() => {
                          setReview(false);
                          setConsent(false);
                        }}
                      >
                        Edit room details
                      </button>
                    )}
                  </div>
                )}
                {job && (
                  <button className="text-link" disabled={busy} onClick={reset}>
                    {generating ? "Cancel and clear this attempt" : "Clear concept & edit details"}
                  </button>
                )}
              </div>
            )}
            {error && (
              <p className="ai-error" role="alert" ref={errorMessage} tabIndex={-1}>
                {error}
              </p>
            )}
          </div>
        </section>
        {job?.state === "completed" && (
          <section className="wrap section ai-result" aria-label="Your AI room concept">
            <span className="eyebrow">03 / ONE POSSIBLE DIRECTION</span>
            <h2>
              Your room. <em>A fresh perspective.</em>
            </h2>
            <p>
              Drag to compare. Images retain their own proportions; this is not a measured overlay.
            </p>
            <div className="ai-comparison">
              <img src={job.original} alt="Original room photograph" />
              <div style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
                <img
                  src={job.concept}
                  alt="AI-generated room design concept, for inspiration only"
                />
              </div>
              <span className="ai-divider" style={{ left: `${split}%` }} />
              <b className="ai-original-label">Original</b>
              <b className="ai-concept-label">AI concept</b>
            </div>
            <label className="ai-field">
              Compare original and concept
              <input
                type="range"
                min="0"
                max="100"
                value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
                aria-valuetext={`${split}% original, ${100 - split}% AI concept`}
              />
            </label>
            <button className="button outline" onClick={download}>
              <Download size={17} />
              Download AI concept
            </button>
            <p className="ai-fine">
              Download or add the concept to your project brief before leaving. Preview images
              expire after 30 minutes. A restart clears them sooner.
            </p>
          </section>
        )}
      </div>
      <section className="wrap ai-explainer">
        <div>
          <span className="eyebrow">FROM POSSIBILITY TO A PLAN</span>
          <h2>
            An idea to explore.
            <br />
            <em>A designer to make it yours.</em>
          </h2>
        </div>
        <p>
          Your concept starts a conversation. We’ll review the actual dimensions, practical layout,
          materials and project scope with you before recommending a design or quote.
        </p>
      </section>
    </PageShell>
  );
}
