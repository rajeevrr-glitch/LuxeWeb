import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RouteErrorFallback } from "@/components/RouteError";
import { Phone, Mail, MapPin, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Luxe Infra — Book a Free Design Consultation" },
      { name: "description", content: "Get in touch with Luxe Infra. Call 90262 71638 or email infoluxeinfra@gmail.com to book a free interior design consultation." },
      { property: "og:title", content: "Contact — Luxe Infra" },
      { property: "og:description", content: "Book a free design consultation." },
    ],
  }),
  component: Contact,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
});

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Please enter your full name." })
    .max(100, { message: "Name must be under 100 characters." }),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,17}$/, { message: "Please enter a valid phone number." }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address." })
    .max(255, { message: "Email must be under 255 characters." }),
  projectType: z.string().trim().min(1).max(60),
  message: z.string().trim().max(1000, { message: "Please keep it under 1000 characters." }).optional(),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

const WHATSAPP_NUMBER = "9026271638";

function Contact() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const parsed = contactSchema.safeParse(data);

      if (!parsed.success) {
        const fieldErrors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof FieldErrors;
          if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        setStatus("idle");
        toast.error("Please check the highlighted fields and try again.");
        return;
      }

      setErrors({});

      const v = parsed.data;
      const text = [
        `Hi Luxe Infra, I'd like a free consultation.`,
        `Name: ${v.name}`,
        `Phone: ${v.phone}`,
        `Email: ${v.email}`,
        `Project: ${v.projectType}`,
        v.message ? `Details: ${v.message}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast.message("Pop-up blocked", {
          description: "Please allow pop-ups, or call us on 90262 71638.",
        });
      }

      setStatus("sent");
      toast.success("Thank you! We'll be in touch within 24 hours.");
    } catch (error) {
      console.error(error);
      setStatus("error");
      toast.error("We couldn't send your request. Please call 90262 71638 instead.");
    }
  }

  const fieldClass = (hasError?: string) =>
    `mt-2 w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${
      hasError ? "border-destructive" : "border-input"
    }`;


  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / Contact</p>
        <h1 className="mt-6 font-display text-5xl md:text-6xl">Let's design together</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Tell us about your home and we'll get back within 24 hours with next steps and a free consultation slot.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-5">
            <a href="tel:9026271638" className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><Phone className="h-5 w-5" /></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Call us</div>
                <div className="font-display text-xl">+91 90262 71638</div>
              </div>
            </a>
            <a href="mailto:infoluxeinfra@gmail.com" className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><Mail className="h-5 w-5" /></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Email us</div>
                <div className="font-display text-xl break-all">infoluxeinfra@gmail.com</div>
              </div>
            </a>
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><MapPin className="h-5 w-5" /></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Studio</div>
                <div className="font-display text-xl">India</div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><Clock className="h-5 w-5" /></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Hours</div>
                <div className="font-display text-xl">Mon–Sat · 10am – 7pm</div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-3 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
          >
            <h2 className="font-display text-2xl">Book a free consultation</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Name</span>
                <input name="name" maxLength={100} aria-invalid={!!errors.name} className={fieldClass(errors.name)} />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</span>
                <input name="phone" type="tel" maxLength={20} aria-invalid={!!errors.phone} className={fieldClass(errors.phone)} />
                {errors.phone && <FieldError>{errors.phone}</FieldError>}
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</span>
                <input name="email" type="email" maxLength={255} aria-invalid={!!errors.email} className={fieldClass(errors.email)} />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project Type</span>
                <select name="projectType" defaultValue="Full Home Interiors" className={fieldClass()}>
                  <option>Full Home Interiors</option>
                  <option>Modular Kitchen</option>
                  <option>Wardrobes</option>
                  <option>Single Room</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tell us about your project</span>
                <textarea name="message" rows={4} maxLength={1000} aria-invalid={!!errors.message} className={fieldClass(errors.message)} />
                {errors.message && <FieldError>{errors.message}</FieldError>}
              </label>
            </div>

            {status === "sent" && (
              <p className="mt-5 flex items-start gap-2 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Thank you — your request is on its way. Our designer will reach out within 24 hours.
              </p>
            )}
            {status === "error" && (
              <p className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                We couldn't send your request just now. Please call{" "}
                <a href="tel:9026271638" className="underline">90262 71638</a>.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "sending" ? "Sending…" : status === "sent" ? "Send another request" : "Request Consultation"}
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
