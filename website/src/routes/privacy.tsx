import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { business } from "@/lib/business";
import { TrafficPreference } from "@/components/TrafficPreference";
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
          <h2>You choose when to contact us</h2>
          <p>
            When automatic online submission is enabled, the form shows Send my quote request (or
            Submit my brief / Send my introduction). Submitting sends your name, phone, city,
            project details and consent through LuxeInfra’s server handler hosted by Netlify. Your
            full text request is saved in a private Supabase database for the team to review. A
            reference confirms that your request was saved; it does not confirm a booking, quotation
            or that a team member has read it. When internal email alerts are enabled, Resend sends
            your contact details and a short project summary to LuxeInfra’s business inboxes so the
            team can follow up. A saved reference does not confirm email delivery. Automatic
            WhatsApp alerts are not connected. Photos and plans are not uploaded with the request.
          </p>
          <p>
            When the form offers Continue in WhatsApp, it follows the manual process below. If
            automatic submission cannot be confirmed, you can retry or use the manual WhatsApp
            fallback. Include any displayed reference so the team can check the existing request. A
            timeout does not prove that nothing arrived.
          </p>
          <h2>Manual WhatsApp and email sharing</h2>
          <p>
            In the manual flow, the short enquiry form and budget planner prepare your name, phone
            number, city, broad scope and any optional email or preferred call window. Continuing
            from the short quote form opens WhatsApp directly with these details in a draft. You
            still need to press Send in WhatsApp. An email draft is available as a fallback. Nothing
            is submitted to a website enquiry service, and this website cannot confirm message
            delivery. Continuing passes the draft details to WhatsApp through its link before you
            press Send; LuxeInfra receives the chat message only when you send it. The website does
            not save your contact details to browser storage.
          </p>
          <p>
            The budget planner saves your location, scope, approximate sizes and finish preferences
            in this browser tab’s session storage. These choices can carry into your enquiry when
            you choose to discuss your selection. Names, phone numbers, email addresses and
            preferred call windows are not saved to browser storage. They are sent to the server
            only when you explicitly submit using automatic delivery, or passed to an external app
            when you choose manual sharing. You can edit your choices before sending. Closing the
            tab ends this session; clearing website data also removes saved choices.
          </p>
          <h2>Partnership and career introductions</h2>
          <p>
            The partnership form prepares your interest, name, phone number, city and any optional
            organisation or introduction you add. When automatic online submission is enabled, these
            details follow the private saving process above. Otherwise, continuing opens a WhatsApp
            draft for you to review and send yourself. Email remains available as a fallback. These
            details are not saved to browser storage. LuxeInfra uses the details you send to review
            and respond to your introduction.
          </p>
          <h2>The optional detailed brief</h2>
          <p>
            The planner brings together your room choices, city, contact details, notes and
            inspiration references. When automatic online submission is enabled, its full text is
            saved privately for the team to review. Otherwise, continuing opens WhatsApp with your
            brief or a shorter introduction for long briefs. Press Send there to contact LuxeInfra.
            The full brief can also be downloaded in your browser.
          </p>
          <p>
            When using manual sharing, WhatsApp opens a message for you to review and send. Email
            opens a draft addressed to sales@luxeinfra.in, with infoluxeinfra@gmail.com copied.
            Download and attach your complete brief and any plans or photos yourself. These external
            services process information under their own policies. LuxeInfra uses the details you
            send to discuss and respond to your project enquiry.
          </p>
          <h2>Choices saved in your browser</h2>
          <p>
            The welcome invitation keeps a simple seen flag in this tab’s session storage so it does
            not keep interrupting your visit. This flag contains no contact details. Closing the
            welcome form clears its personal contact fields. You can use Get a quote to start again;
            the header quote button reopens the invitation on browsing pages.
          </p>
          <p>
            Room, work, style, and other non-contact preferences, along with saved inspiration
            ideas, are kept in your browser so you can return to them. Contact details and uploads
            are not saved in browser storage. Clearing this website’s browser data removes your
            saved preferences.
          </p>
          <p>
            The design comparison saves only selected design references and fixed preference tags,
            such as layout or colour palette. Any notes you type stay in the current page and can be
            included in a decision sheet only when you choose to download it. Planning-guide
            checklist ticks also stay on the current page. Leaving or refreshing clears these notes
            and checklist ticks; they are not automatically sent to LuxeInfra.
          </p>
          <h2>Room photos and image generation</h2>
          <p>
            Selected photos stay in the current tab while you prepare your room brief. They are not
            uploaded through the project planner. Leaving or refreshing the page may lose your
            unfinished brief. The public release does not enable AI generation; no photo is sent to
            an AI provider.
          </p>
          <p>
            In an enabled local trial, Generate my room concept sends your photo, room details and
            instructions to the provider named beside the consent checkbox, such as Google Gemini.
            The local service removes embedded photo metadata before sending it. Provider terms
            apply separately. Local results are private to your browser session and expire after 30
            minutes or when the local service restarts. Downloads you keep are not removed by that
            expiry. A generated concept is inspiration, not a measured drawing.
          </p>
          <h2>Room design contact details</h2>
          <p>
            In an enabled local Room Studio trial, your name, mobile number, city and separate
            contact consent must be saved before image generation can begin. These details are saved
            privately with an enquiry reference, separate from the photo and AI prompt. They are not
            saved to browser storage or sent to the image provider. This local save does not deliver
            a request to the studio; use the offered WhatsApp handoff to review and send it. Contact
            records remain until managed or deleted by LuxeInfra; the thirty-minute image/session
            expiry does not delete contact records. Public AI and hosted capture need their own
            configured private service before activation.
          </p>
          <h2>Ask Luxe</h2>
          <p>
            Luxe is a website assistant, not a live member of the team. Website guidance runs in
            your current page without sending your question to an AI service. The conversation is
            not saved in browser storage and is cleared when the page is refreshed or you choose
            Clear conversation. Chat does not submit an enquiry or book a visit.
          </p>
          <p>
            If AI is connected and you choose Start an AI conversation, each question you send goes
            through our private server to Google Gemini. Previous conversation messages are not
            included. Avoid personal, confidential or payment information. We request that the
            interaction is not stored in the provider’s Interactions history; Google’s applicable
            processing and retention terms still apply separately. Our chat service does not save
            question or answer text. It uses a short-lived private session cookie and a daily
            attempt count to limit use. Closing the panel does not withdraw a question already sent.
          </p>
          <h2>Website delivery</h2>
          <p>
            Your browser requests website files and fonts from the hosting and font services. Those
            services receive connection information such as your IP address. This website does not
            add advertising trackers.
          </p>
          <h2 id="site-statistics">Basic website statistics</h2>
          <p>
            When enabled, LuxeInfra counts public page views using its Netlify server and private
            Supabase database. The owner can see page totals, broad source categories such as Google
            or Instagram, device categories and daily visitor estimates. Page queries, URL
            fragments, form answers, names, phone numbers and chat messages are not included in
            these statistics. The private admin and password-reset pages are excluded.
          </p>
          <p>
            Visitor estimates use a daily changing keyed value derived on the server from the
            connection IP address and a bounded browser User-Agent. The statistics tables do not
            store the raw IP address or User-Agent, and the daily value is not linked to customer
            contact records. No analytics cookie or persistent visitor identifier is placed in your
            browser. Saved-enquiry totals are shown separately; they do not identify which visitor
            made an enquiry or confirm a sale. Counts are estimates and exclude recognised bots.
          </p>
          <p>
            Do Not Track and Global Privacy Control preferences are respected. You can also exclude
            future visits from this browser below; only that preference is saved in browser storage.
            This does not undo existing aggregated counts. Daily counting and duplicate-protection
            entries older than seven IST calendar days, and aggregates older than ninety days, are
            removed when the next valid page-view request is processed. If collection stops, cleanup
            waits until another request is processed or the team removes the records.
          </p>
          <TrafficPreference />
          <h2>Questions or deletion requests</h2>
          <p>
            Contact <a href={"mailto:" + business.email}>{business.email}</a> about your project
            information, corrections or deletion requests. When automatic online submission is
            enabled, text requests remain in LuxeInfra’s private Supabase database until managed or
            deleted by the team. Contact details and files shared through WhatsApp or email also
            remain in those receiving services until managed there. Closing a form or leaving the
            page does not withdraw a request already submitted.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
