import { promotionState, type Promotion } from "./promotion";
export { diwaliCampaign, festiveCampaignContext } from "./promotion";

export const festiveOffer: Promotion = {
  id: "festive-15",
  percent: 15,
  approved: true,
  availability: "ongoing",
  startsAt: "",
  endsAt: "",
  terms: [
    "15% off on all works.",
    "Additional Diwali gifts are included with the festive offer.",
    "The scope, discounted amount, taxes, gift details and any booking requirements will be confirmed in your written quotation.",
  ],
};

export const campaignPreview = import.meta.env.VITE_CAMPAIGN_PREVIEW === "true";
export function getFestiveState() {
  return promotionState(festiveOffer, campaignPreview);
}
