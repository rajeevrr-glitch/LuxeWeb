export const partnerRoles = [
  {
    id: "design",
    title: "Architects & designers",
    short: "Design collaboration",
    text: "Bring your design perspective. Explore how our scopes, materials and project needs could fit together.",
  },
  {
    id: "referral",
    title: "Referral partners",
    short: "Referral partnership",
    text: "Know someone planning their interiors? Discuss a clear referral arrangement before introducing a client.",
  },
  {
    id: "property",
    title: "Property professionals",
    short: "Property collaboration",
    text: "Builders, brokers and property teams. Explore an interiors conversation for your homeowners.",
  },
  {
    id: "trade",
    title: "Makers, vendors & teams",
    short: "Vendor / execution network",
    text: "Share your material range, craft or execution capabilities and the locations you cover.",
  },
  {
    id: "careers",
    title: "Join the team",
    short: "Career interest",
    text: "Interested in working with LuxeInfra? Introduce your skills. This is an expression of interest, not an advertised vacancy.",
  },
] as const;
export type PartnerRole = (typeof partnerRoles)[number]["id"];
export type PartnerDraft = {
  role: string;
  name: string;
  phone: string;
  city: string;
  organisation: string;
  note: string;
};
export function partnerRole(value: unknown): PartnerRole | undefined {
  return partnerRoles.find((role) => role.id === value)?.id;
}
export function validatePartner(draft: PartnerDraft): string {
  if (!partnerRole(draft.role)) return "Choose the kind of opportunity you’re interested in.";
  if (!draft.name.trim() || !draft.city.trim())
    return "Add your name and city to prepare your introduction.";
  if (!/^(?:\+?91)?[6-9]\d{9}$/.test(draft.phone.replace(/[()\s-]/g, "")))
    return "Enter a valid 10-digit Indian mobile number, with or without +91.";
  if (
    draft.name.length > 80 ||
    draft.city.length > 100 ||
    draft.organisation.length > 120 ||
    draft.note.length > 600
  )
    return "Please shorten your details to fit the field limits.";
  return "";
}
export function partnerMessage(draft: PartnerDraft): string {
  const role = partnerRoles.find((role) => role.id === draft.role);
  return [
    "Hello LuxeInfra, I’d like to explore an opportunity with you.",
    "",
    "Interest: " + (role?.short || "Partnership"),
    "Name: " + draft.name.trim(),
    "Phone: " + draft.phone.trim(),
    "City: " + draft.city.trim(),
    draft.organisation.trim() ? "Organisation / profession: " + draft.organisation.trim() : "",
    draft.note.trim() ? "\nIntroduction: " + draft.note.trim() : "",
    "\nPlease contact me about this introduction.",
  ]
    .filter((line, index) => line || index === 1)
    .join("\n");
}
