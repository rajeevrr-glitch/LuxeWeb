const finishes = ["False ceiling", "Lighting", "Painting", "Flooring & tiling", "Electrical"];
const bedroom = ["Design & layout", "Wardrobes & storage", "TV unit & cabinetry", ...finishes, "Furniture & decor"];
export const roomWork: Record<string, { hint: string; options: string[] }> = {
  Kitchen: { hint: "Plan the cooking, preparation and storage areas.", options: ["Design & layout", "Modular kitchen", "Countertop & backsplash", ...finishes, "Plumbing"] },
  "Living & dining": { hint: "Make space for gathering, dining and everyday living.", options: ["Design & layout", "TV unit & cabinetry", "Display & storage", ...finishes, "Furniture & decor"] },
  "Master bedroom": { hint: "A restful room, with storage that works for you.", options: bedroom },
  "Other bedrooms": { hint: "Plan sleeping, storage and study needs for these rooms.", options: [...bedroom, "Study desk"] },
  Bathrooms: { hint: "Focus on wet areas, fittings and practical storage.", options: ["Design & layout", "Vanity & storage", "Sanitary fittings", "Waterproofing", "Flooring & tiling", "Plumbing", "Lighting", "Electrical", "Ventilation", "False ceiling"] },
  "Home office": { hint: "Build a comfortable place to focus.", options: ["Design & layout", "Workstation & desk", "Display & storage", ...finishes, "Furniture & decor"] },
  "Pooja space": { hint: "A considered corner for your daily rituals.", options: ["Design & layout", "Mandir unit", "Display & storage", "Lighting", "Painting", "Flooring & tiling", "Electrical", "Furniture & decor"] },
  "Other space": { hint: "Choose the broad requirements and describe this space in your notes.", options: ["Design & layout", "Display & storage", ...finishes, "Plumbing", "Furniture & decor"] },
};
export function getRoomWorkOptions(room: string): string[] {
  return Object.hasOwn(roomWork, room) ? roomWork[room].options : [];
}
/** Discard stale and cross-room selections before restoring an older browser draft. */
export function sanitiseRoomWork(selected: unknown, saved: unknown): Record<string, string[]> {
  if (!Array.isArray(selected) || !saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  return Object.fromEntries(selected.filter((r): r is string => typeof r === "string" && Object.hasOwn(roomWork, r)).map((r) => {
    const choices = Object.hasOwn(saved, r) ? (saved as Record<string, unknown>)[r] : [];
    return [r, Array.isArray(choices) ? [...new Set(choices.filter((w): w is string => typeof w === "string" && getRoomWorkOptions(r).includes(w)))] : []];
  }));
}
