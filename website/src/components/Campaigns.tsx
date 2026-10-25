import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, Gift, Handshake, Pause, Play } from "lucide-react";
import { diwaliCampaign, festiveOffer, getFestiveState } from "@/lib/campaigns";
import home from "@/assets/ideas/living/03.jpg";
import office from "@/assets/ideas/office/02.jpg";

export function PromotionBar() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="lc-promo-bar lc-diwali-bar" data-paused={paused}>
      <div className="wrap">
        <span className="lc-promo-signature">
          <Flame size={14} /> THE DIWALI EDIT
        </span>
        <Link
          to="/offers"
          className="lc-promo-message"
          aria-label="The Diwali Edit. This Diwali, light up your home with 15% off on all works and additional Diwali gifts. View offer details."
        >
          <span className="lc-promo-ticker" aria-hidden="true">
            <span className="lc-promo-track">
              <span>
                This Diwali, light up your home. <strong>15% off all works + Diwali gifts.</strong>
                <i>✦</i>
              </span>
              <span>
                This Diwali, light up your home. <strong>15% off all works + Diwali gifts.</strong>
                <i>✦</i>
              </span>
            </span>
          </span>
          <span className="lc-promo-pill">Explore</span>
        </Link>
        <button
          type="button"
          className="lc-promo-pause"
          aria-label={
            paused ? "Resume Diwali announcement motion" : "Pause Diwali announcement motion"
          }
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
        </button>
        <Link to="/partner-with-us" className="lc-promo-partner">
          Partner with us
        </Link>
      </div>
    </div>
  );
}

export function FestiveFeature() {
  const state = getFestiveState();
  return (
    <section className="wrap lc-festive" aria-labelledby="festive-title">
      <div className="lc-festive-photo">
        <img
          src={home}
          alt="A warm living room with natural textures, for design inspiration"
          loading="lazy"
          width="900"
          height="675"
        />
        <span>A LITTLE LIGHT. A WHOLE NEW FEELING.</span>
      </div>
      <div className="lc-festive-copy">
        <span className="lc-kicker">
          <Flame size={16} /> THE DIWALI EDIT
        </span>
        <h2 id="festive-title">
          This Diwali, light up
          <br />
          the way you live.
        </h2>
        {state !== "unavailable" && (
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
        )}
        <span className="lc-festive-gift">
          <Gift size={16} /> Plus additional Diwali gifts
        </span>
        <p>
          Warm lighting. Beautiful finishes. Space for everyone you love. Give your home a festive
          chapter that lasts beyond the celebrations.
        </p>
        <Link to="/offers" className="button">
          <Gift size={17} /> Explore {diwaliCampaign.name}
        </Link>
        <small>
          {state === "preview"
            ? "Offer preview. Booking dates, eligible amount and final terms are awaiting confirmation."
            : state === "live"
              ? "Discounted amount, taxes and gift details will be confirmed in your written quotation."
              : "Discuss your project with us. Any applicable offer will be confirmed in your written quotation."}
        </small>
      </div>
    </section>
  );
}

export function PartnerInvitation() {
  return (
    <section className="wrap lc-section">
      <div className="lc-partner-invite">
        <div>
          <span className="lc-kicker">
            <Handshake size={17} /> THE LUXEINFRA NETWORK
          </span>
          <h2>
            Great spaces start
            <br />
            with great collaborations.
          </h2>
          <p>
            Designers, architects, property professionals and makers. Bring your expertise, and
            let’s explore what we could create together.
          </p>
          <Link to="/partner-with-us" className="button">
            <Handshake size={17} /> Partner with LuxeInfra
          </Link>
          <span className="lc-partner-invite-note">
            Explore collaborations, referrals and opportunities to join our network.
          </span>
        </div>
        <div className="lc-partner-invite-photo">
          <img
            src={office}
            alt="Home workspace design inspiration with warm wood finishes"
            loading="lazy"
            width="800"
            height="600"
          />
          <span>Good ideas deserve good company.</span>
        </div>
      </div>
    </section>
  );
}
