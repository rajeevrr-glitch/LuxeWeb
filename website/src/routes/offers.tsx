import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Gift, Layers3, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { diwaliCampaign, festiveOffer, getFestiveState } from "@/lib/campaigns";
import living from "@/assets/ideas/living/03.jpg";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "The Diwali Edit — LuxeInfra" },
      { name: "robots", content: "noindex, follow" },
      {
        name: "description",
        content:
          "Explore the LuxeInfra festive edit and discuss your next interior project with the studio.",
      },
    ],
  }),
  component: Offers,
});

function Offers() {
  const state = getFestiveState();
  const visible = state !== "unavailable";
  return (
    <PageShell>
      <section className="wrap lc-offer-hero">
        <div className="lc-offer-story">
          <span className="lc-kicker">
            <Flame size={16} /> THE DIWALI EDIT
          </span>
          <h1>
            This Diwali,
            <br />
            <span>light up your home.</span>
          </h1>
          <p>
            Warm lighting, thoughtful storage and room for everyone you love. Make your next chapter
            feel like a celebration, every day.
          </p>
          {visible ? (
            <>
              <div className="lc-discount">
                <strong>
                  {festiveOffer.percent}
                  <span>%</span>
                </strong>
                <div>
                  OFF
                  <span>{state === "preview" ? "Proposed festive offer" : "On all works"}</span>
                </div>
              </div>
              <span className="lc-festive-gift">
                <Gift size={17} /> Plus additional Diwali gifts
              </span>
              <Link to="/callback" search={{ offer: festiveOffer.id }} className="button">
                <Gift size={17} /> Discuss my festive project
              </Link>
              {state === "preview" && (
                <p className="lc-offer-disclosure">
                  Design preview: this proposed discount is not open for booking yet. Dates,
                  eligibility and the amount it applies to will be confirmed before launch.
                </p>
              )}
            </>
          ) : (
            <>
              <p>
                Start with a room, a kitchen or your whole home. Ask the studio about current
                festive offers; any savings and eligibility will be confirmed in your quotation.
              </p>
              <Link to="/callback" search={{ offer: diwaliCampaign.id }} className="button">
                <MessageCircle size={17} /> Plan my Diwali home
              </Link>
            </>
          )}
        </div>
        <div className="lc-offer-image">
          <img
            src={living}
            alt="Living room inspiration featuring warm timber and comfortable seating"
            width="1000"
            height="900"
            fetchPriority="high"
          />
          <span>A little light. A whole new feeling.</span>
        </div>
      </section>
      <section className="wrap lc-section lc-offer-details" aria-labelledby="offer-details">
        <div>
          <span className="lc-kicker">A GOOD DECISION STARTS WITH CLARITY</span>
          <h2 id="offer-details">
            The details, before
            <br />
            the celebration.
          </h2>
          <p>
            Any discount belongs in a written quotation, alongside the scope, specifications, taxes
            and exclusions.
          </p>
          <Link to="/materials" className="lc-text-action">
            Get to know your materials
          </Link>
        </div>
        <div className="lc-offer-terms">
          {state === "live" ? (
            <>
              <h3>Offer terms</h3>
              <ul>
                {festiveOffer.terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
              {festiveOffer.availability !== "ongoing" && (
                <p>
                  Booking period:{" "}
                  {new Date(festiveOffer.startsAt).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  –{" "}
                  {new Date(festiveOffer.endsAt).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                  .
                </p>
              )}
            </>
          ) : (
            <>
              <span className="lc-preview-label">
                {state === "preview" ? "OFFER PREVIEW" : "YOUR DIWALI PROJECT"}
              </span>
              <h3>
                {state === "preview" ? "What will be confirmed" : "Discuss your project first"}
              </h3>
              <ul>
                <li>Booking dates and service locations</li>
                <li>Eligible work, minimum value and any discount cap</li>
                <li>Whether the discount applies before taxes, and which items are excluded</li>
                <li>Payment conditions and whether other offers can be combined</li>
              </ul>
              <p>No discounted price is calculated or promised while these terms are pending.</p>
            </>
          )}
        </div>
      </section>
      <section className="lc-gallery-section">
        <div className="wrap lc-section lc-offer-starts">
          <div>
            <Layers3 size={24} />
            <h3>Find your direction</h3>
            <p>Explore kitchens, wardrobes and complete homes.</p>
            <Link to="/design-ideas" className="lc-text-action">
              Browse inspiration
            </Link>
          </div>
          <div>
            <Gift size={24} />
            <h3>Start with your priorities</h3>
            <p>Choose the rooms and work you have in mind.</p>
            <Link to="/estimate" className="lc-text-action">
              Explore my scope
            </Link>
          </div>
          <div>
            <MessageCircle size={24} />
            <h3>Make it personal</h3>
            <p>Talk through your ideas and quotation with the studio.</p>
            <Link
              to="/callback"
              search={{ offer: visible ? festiveOffer.id : diwaliCampaign.id }}
              className="lc-text-action"
            >
              Let’s talk interiors
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
