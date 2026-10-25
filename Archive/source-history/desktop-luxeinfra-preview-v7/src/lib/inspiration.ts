import { spaces, designsFor } from "./spaces";
export type Inspiration = { id: string; title: string; image: string };
const key = "luxeinfra-inspiration-v1";
const catalogue = new Map(spaces.flatMap((s) => designsFor(s.slug)).map((item) => [item.id, item]));
export function readInspiration(): Inspiration[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) return [];
    const ids = [
      ...new Set(value.filter((x) => typeof x?.id === "string").map((x) => x.id as string)),
    ];
    return ids
      .flatMap((id) => {
        const current = catalogue.get(id);
        return current ? [current] : [];
      })
      .slice(-12);
  } catch {
    return [];
  }
}
export function saveInspiration(item: Inspiration) {
  const current = catalogue.get(item.id);
  if (!current) throw new Error("This design is no longer available.");
  const all = readInspiration();
  const next = all.some((x) => x.id === current.id)
    ? all.filter((x) => x.id !== current.id)
    : [...all, current].slice(-12);
  localStorage.setItem(key, JSON.stringify(next.map(({ id }) => ({ id }))));
  window.dispatchEvent(new Event("luxe-shortlist"));
  return next;
}
