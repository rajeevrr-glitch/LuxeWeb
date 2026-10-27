export const business = {
  name: "LuxeInfra",
  siteUrl: "https://luxeinfra.in",
  email: "sales@luxeinfra.in",
  alternateEmail: "infoluxeinfra@gmail.com",
  phone: "+91 90262 71638",
  secondaryPhone: "+91 76784 32743",
  secondaryPhoneHref: "tel:+917678432743",
  phoneHref: "tel:+919026271638",
  whatsapp: "https://wa.me/919026271638",
  areas: ["Uttar Pradesh", "Delhi NCR", "Bengaluru"],
  ncrCities: ["Ghaziabad", "Noida"],
};
// Keep submitted region values stable; city names are part of the public label.
export function serviceRegionLabel(region: string) {
  return region === "Delhi NCR" ? `${region} (${business.ncrCities.join(" & ")})` : region;
}
export const serviceAreaLabels = business.areas.map(serviceRegionLabel);
export const serviceAreaSummary = serviceAreaLabels.join(", ");
export const rooms = [
  "Kitchen",
  "Living & dining",
  "Master bedroom",
  "Other bedrooms",
  "Bathrooms",
  "Home office",
  "Pooja space",
  "Other space",
];
export const stages = [
  [
    "Share your brief",
    "Your rooms, your priorities, your inspiration. Start with what you know; we can work through the rest together.",
  ],
  [
    "Discuss your space",
    "We review your requirements and confirm the location, scope, and the next consultation or site visit.",
  ],
  [
    "Shape the design",
    "Explore the layout, materials, and finishes. Review an itemised quotation with clear inclusions and exclusions.",
  ],
  [
    "Bring it to life",
    "Once the design, scope, and schedule are agreed, work moves into execution. Changes are discussed before approval.",
  ],
  [
    "Make yourself at home",
    "Review the finished work together, with the applicable care guidance, warranty terms, and support details.",
  ],
];
export const faqs = [
  [
    "Can I start with just one room?",
    "Yes. Start with a kitchen, a room, or a set of upgrades. Plan your interiors or send a short enquiry to the studio.",
  ],
  [
    "What if I do not have a floor plan?",
    "You can continue without one. Approximate dimensions or room photographs are helpful; exact measurements can be discussed later.",
  ],
  [
    "Will I get an instant price?",
    "For full home renovation, enter the floor area where work is required and choose Essential, Signature or Luxe to see a starting estimate. The calculator is in its early stages; your final price will be quoted after a site visit. Modular interiors, selected-room work and commercial spaces need a separate studio quotation.",
  ],
  [
    "Where do you work?",
    `LuxeInfra serves ${serviceAreaSummary}. Share your city or locality so we can confirm arrangements for your site.`,
  ],
  [
    "What affects the final quotation?",
    "Measured quantities, the work selected, materials, hardware, finishes, site conditions, and any approved changes. The quotation should clearly identify what is included and excluded.",
  ],
  [
    "How long will my project take?",
    "The schedule depends on your scope, design approvals, material availability, and site readiness. We agree the timeline for your project after reviewing these details.",
  ],
];
