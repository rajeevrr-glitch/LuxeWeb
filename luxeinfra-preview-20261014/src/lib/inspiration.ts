export type Inspiration = { id: string; title: string; image: string };
const key = "luxeinfra-inspiration-v1";
export function readInspiration(): Inspiration[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (x) =>
              typeof x?.id === "string" &&
              typeof x?.title === "string" &&
              typeof x?.image === "string",
          )
          .slice(0, 12)
      : [];
  } catch {
    return [];
  }
}
export function saveInspiration(item: Inspiration) {
  const all = readInspiration();
  const next = all.some((x) => x.id === item.id)
    ? all.filter((x) => x.id !== item.id)
    : [...all, item].slice(-12);
  localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new Event("luxe-shortlist"));
  return next;
}
