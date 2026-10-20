import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { PlanLink } from "@/components/StudioLayout";
import { business, stages } from "@/lib/business";
import homeImage from "@/assets/full-home.jpg";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Your project. Your information. — LuxeInfra" }] }),
  component: Page,
});
function Page() {
  return (
    <PageShell>
      <section className="wrap section">
        <div className="page-intro">
          <span className="eyebrow">LUXEINFRA / PRIVACY</span>
          <h1>Your project. Your information.</h1>
        </div>
        <div className="reading-copy">
          <p>
            This notice describes the private local preview. It must be reviewed and updated for the
            final hosting and enquiry service before public launch.
          </p>
          <h2>What the planner collects</h2>
          <p>
            Your project choices, location, contact details, optional notes, selected inspiration
            references, and files you choose to attach are included in your brief.
          </p>
          <h2>Where your brief goes in this preview</h2>
          <p>
            Submitting saves it privately on the computer running this preview. It does not send an
            email or WhatsApp message. The site does not provide a public link to your uploaded
            files.
          </p>
          <h2>Choices saved in your browser</h2>
          <p>
            Room, work, style, and other non-contact preferences, along with saved inspiration
            ideas, are kept in your browser so you can return to them. Contact details and uploads
            are not saved in browser storage. Clearing this website’s browser data removes your
            saved preferences.
          </p>
          <h2>Room photos and AI concepts</h2>
          <p>
            Selecting a photo on Reimagine keeps it in your tab. Only choosing Generate, with your
            consent, sends the photo and your room instructions to the selected image provider
            (OpenAI, or Hugging Face through fal). The local service resizes the photo and removes
            embedded location metadata first. The provider processes the image under its own
            policies.
          </p>
          <p>
            Local visualiser images are held temporarily in memory for up to 30 minutes, or until
            cleared or the service restarts. Provider copies are subject to that provider’s
            retention rules. Adding a photo or concept to your project brief carries it in your tab
            until you submit the planner; submitted attachments then remain in the private local
            enquiry folder. Refreshing the page may lose an unfinished brief. The pilot stores a
            generation-attempt count without your photo or description.
          </p>
          <h2>When you choose WhatsApp or email</h2>
          <p>
            These links open the relevant service. You decide whether to send a message there. Those
            services process information according to their own policies.
          </p>
          <h2>Questions or deletion requests</h2>
          <p>
            Contact <a href={"mailto:" + business.email}>{business.email}</a> about your project
            information. For local testing, the person operating this preview can remove the saved
            test brief from its private storage folder.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
