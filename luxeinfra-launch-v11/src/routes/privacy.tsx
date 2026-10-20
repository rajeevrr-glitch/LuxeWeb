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
          <p>This notice explains how this website handles your project information.</p>
          <h2>Your project brief stays with you until you send it</h2>
          <p>The planner brings together your room choices, city, contact details, notes and inspiration references. Preparing a brief does not submit these details to LuxeInfra. The download is created in your browser.</p>
          <p>WhatsApp opens a message for you to review and send. Email opens a draft addressed to sales@luxeinfra.in, with infoluxeinfra@gmail.com copied. Download and attach your complete brief and any plans or photos yourself. These external services process information under their own policies. LuxeInfra uses the details you send to discuss and respond to your project enquiry.</p>
          <h2>Choices saved in your browser</h2>
          <p>
            Room, work, style, and other non-contact preferences, along with saved inspiration
            ideas, are kept in your browser so you can return to them. Contact details and uploads
            are not saved in browser storage. Clearing this website’s browser data removes your
            saved preferences.
          </p>
          <h2>Room photos and image generation</h2>
          <p>Selected photos stay in the current tab while you prepare your room brief. They are not uploaded through the project planner. Leaving or refreshing the page may lose your unfinished brief. The public release does not enable AI generation; no photo is sent to an AI provider.</p>
          <h2>Website delivery</h2>
          <p>Your browser requests website files and fonts from the hosting and font services. Those services receive connection information such as your IP address. This website does not add advertising trackers or visitor analytics.</p>
          <h2>Questions or deletion requests</h2>
          <p>
            Contact <a href={"mailto:" + business.email}>{business.email}</a> about your project
            information, corrections or deletion requests. Contact details and files sent to the studio remain in the receiving WhatsApp or email service until managed there.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
