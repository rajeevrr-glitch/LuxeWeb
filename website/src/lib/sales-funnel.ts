export type LeadContact = {
  name: string;
  phone: string;
  city: string;
  region: string;
  email: string;
  callTime: string;
};
export const callTimes = [
  "Anytime",
  "Morning · 9 am–12 pm",
  "Afternoon · 12–5 pm",
  "Evening · 5–8 pm",
];
export const emptyContact: LeadContact = {
  name: "",
  phone: "",
  city: "",
  region: "Delhi NCR",
  email: "",
  callTime: "Anytime",
};
export function validateLead(contact: LeadContact) {
  if (!contact.name.trim() || !contact.city.trim()) return "Add your name and city to continue.";
  if (contact.name.trim().length > 80 || contact.city.trim().length > 100)
    return "Keep your name and city within the field limits.";
  if (!/^(?:\+?91)?[6-9]\d{9}$/.test(contact.phone.replace(/[()\s-]/g, "")))
    return "Enter a valid 10-digit Indian mobile number, with or without +91.";
  if (!["Uttar Pradesh", "Delhi NCR", "Bengaluru", "Other"].includes(contact.region))
    return "Choose your service region.";
  if (
    contact.email &&
    (contact.email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()))
  )
    return "Check your email address, or leave it blank.";
  if (!callTimes.includes(contact.callTime)) return "Choose a preferred call window.";
  return "";
}
export function leadMessage(contact: LeadContact, context: string) {
  return [
    "Hello LuxeInfra, I’d like a quote for my interiors.",
    "Name: " + contact.name.trim(),
    "Phone: " + contact.phone.trim(),
    "Location: " + contact.city.trim() + ", " + contact.region,
    contact.email.trim() ? "Email: " + contact.email.trim() : "",
    "Preferred call window: " + contact.callTime + " (IST; subject to confirmation)",
    context,
    "Please contact me about this project.",
  ]
    .filter(Boolean)
    .join("\n");
}
