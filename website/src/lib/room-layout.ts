export type PlanUnit = "feet" | "metres";
export type FurnitureKind = "bed" | "wardrobe" | "desk" | "sofa" | "table" | "column";
export type Wall = "north" | "east" | "south" | "west";
export type PlanItem = {
  id: string;
  kind: FurnitureKind;
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: 0 | 90 | 180 | 270;
};
export type Opening = {
  id: string;
  kind: "door" | "window";
  wall: Wall;
  offset: number;
  width: number;
};
export type RoomLayout = {
  width: number;
  depth: number;
  clearance: number;
  items: PlanItem[];
  openings: Opening[];
};
export type Rect = { x: number; y: number; width: number; depth: number };
export type LayoutIssue = {
  code: string;
  severity: "error" | "warning" | "note";
  message: string;
};
export const furnitureTemplates: Record<
  FurnitureKind,
  { label: string; width: number; depth: number }
> = {
  bed: { label: "Bed", width: 1.52, depth: 2.03 },
  wardrobe: { label: "Wardrobe", width: 1.2, depth: 0.6 },
  desk: { label: "Desk", width: 1.2, depth: 0.6 },
  sofa: { label: "Sofa", width: 2, depth: 0.9 },
  table: { label: "Table", width: 1.2, depth: 0.8 },
  column: { label: "Fixed column", width: 0.3, depth: 0.3 },
};
export const toMetres = (value: number, unit: PlanUnit) => value * (unit === "feet" ? 0.3048 : 1);
export const displayMeasure = (value: number, unit: PlanUnit) =>
  Number((value / (unit === "feet" ? 0.3048 : 1)).toFixed(2));
export const unitLabel = (unit: PlanUnit) => (unit === "feet" ? "ft" : "m");
export function itemRect(item: PlanItem): Rect {
  const turned = item.rotation === 90 || item.rotation === 270;
  return {
    x: item.x,
    y: item.y,
    width: turned ? item.depth : item.width,
    depth: turned ? item.width : item.depth,
  };
}
export function overlaps(a: Rect, b: Rect) {
  const tolerance = 0.001;
  return (
    a.x < b.x + b.width - tolerance &&
    a.x + a.width > b.x + tolerance &&
    a.y < b.y + b.depth - tolerance &&
    a.y + a.depth > b.y + tolerance
  );
}
export function outside(rect: Rect, room: Pick<RoomLayout, "width" | "depth">) {
  return (
    rect.x < -0.001 ||
    rect.y < -0.001 ||
    rect.x + rect.width > room.width + 0.001 ||
    rect.y + rect.depth > room.depth + 0.001
  );
}
export function frontZone(item: PlanItem, gap: number): Rect {
  const r = itemRect(item);
  if (item.rotation === 90) return { x: r.x - gap, y: r.y, width: gap, depth: r.depth };
  if (item.rotation === 180) return { x: r.x, y: r.y - gap, width: r.width, depth: gap };
  if (item.rotation === 270) return { x: r.x + r.width, y: r.y, width: gap, depth: r.depth };
  return { x: r.x, y: r.y + r.depth, width: r.width, depth: gap };
}
export function openingZone(opening: Opening, room: RoomLayout): Rect {
  // Conservative interior reserve, not a surveyed hinge/swing arc or a building-code rule.
  const reserve = opening.kind === "door" ? Math.max(opening.width, room.clearance) : 0.15;
  if (opening.wall === "north")
    return { x: opening.offset, y: 0, width: opening.width, depth: reserve };
  if (opening.wall === "south")
    return { x: opening.offset, y: room.depth - reserve, width: opening.width, depth: reserve };
  if (opening.wall === "west")
    return { x: 0, y: opening.offset, width: reserve, depth: opening.width };
  return { x: room.width - reserve, y: opening.offset, width: reserve, depth: opening.width };
}
const positive = (n: number) => Number.isFinite(n) && n > 0;
export function analyseLayout(room: RoomLayout): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  if (
    !positive(room.width) ||
    !positive(room.depth) ||
    room.width > 30.48 ||
    room.depth > 30.48 ||
    !Number.isFinite(room.clearance) ||
    room.clearance < 0 ||
    room.clearance > 2
  ) {
    return [
      {
        code: "room_dimensions",
        severity: "error",
        message:
          "Enter a room up to 100 ft / 30.48 m on each side and a planning gap between 0 and 2 m.",
      },
    ];
  }
  const valid = room.items.filter((item) => {
    if (
      !positive(item.width) ||
      !positive(item.depth) ||
      !Number.isFinite(item.x) ||
      !Number.isFinite(item.y) ||
      ![0, 90, 180, 270].includes(item.rotation)
    ) {
      issues.push({
        code: "item_dimensions",
        severity: "error",
        message: `${item.label}: check its dimensions and position.`,
      });
      return false;
    }
    return true;
  });
  for (let i = 0; i < valid.length; i++) {
    const item = valid[i];
    const rect = itemRect(item);
    if (outside(rect, room))
      issues.push({
        code: "outside_room",
        severity: "error",
        message: `${item.label} extends beyond the room boundary.`,
      });
    for (const other of valid.slice(i + 1))
      if (overlaps(rect, itemRect(other))) {
        issues.push({
          code: "furniture_overlap",
          severity: "error",
          message: `${item.label} overlaps ${other.label.toLowerCase()}.`,
        });
      }
    if (room.clearance > 0 && item.kind !== "column" && item.kind !== "table") {
      const front = frontZone(item, room.clearance);
      if (outside(front, room))
        issues.push({
          code: "front_at_wall",
          severity: "warning",
          message: `${item.label}: the shaded front gap crosses a wall. Rotate or move it, or review your chosen gap.`,
        });
      if (valid.some((other) => other.id !== item.id && overlaps(front, itemRect(other))))
        issues.push({
          code: "front_obstructed",
          severity: "warning",
          message: `${item.label}: another item occupies its shaded front gap.`,
        });
    }
  }
  for (const opening of room.openings) {
    const wallLength =
      opening.wall === "north" || opening.wall === "south" ? room.width : room.depth;
    if (
      !positive(opening.width) ||
      !Number.isFinite(opening.offset) ||
      opening.offset < 0 ||
      opening.offset + opening.width > wallLength + 0.001
    ) {
      issues.push({
        code: "opening_outside",
        severity: "error",
        message: `${opening.kind === "door" ? "Door" : "Window"}: its width and offset must fit on the selected wall.`,
      });
      continue;
    }
    const zone = openingZone(opening, room);
    for (const item of valid)
      if (overlaps(zone, itemRect(item)))
        issues.push({
          code: opening.kind === "door" ? "door_obstructed" : "window_check",
          severity: opening.kind === "door" ? "warning" : "note",
          message:
            opening.kind === "door"
              ? `${item.label} occupies the door's reserved access area. Confirm the actual hinge and swing on site.`
              : `${item.label} is close to a window. Check sill height and access; this top view does not model height.`,
        });
  }
  return issues;
}
export function sampleLayout(roomName = "Master bedroom"): RoomLayout {
  const layout: RoomLayout = {
    width: 3.6576,
    depth: 3.048,
    clearance: 0.6,
    items: [
      {
        id: "sample-bed",
        kind: "bed",
        label: "Bed",
        x: 0.4,
        y: 0.25,
        width: 1.52,
        depth: 2.03,
        rotation: 0,
      },
      {
        id: "sample-wardrobe",
        kind: "wardrobe",
        label: "Wardrobe",
        x: 2.2,
        y: 0.25,
        width: 1.2,
        depth: 0.6,
        rotation: 0,
      },
    ],
    openings: [
      { id: "sample-door", kind: "door", wall: "south", offset: 2.4, width: 0.85 },
      { id: "sample-window", kind: "window", wall: "west", offset: 0.5, width: 1.2 },
    ],
  };
  if (roomName === "Home office")
    layout.items = [
      {
        id: "sample-desk",
        kind: "desk",
        label: "Desk",
        x: 0.5,
        y: 0.4,
        width: 1.2,
        depth: 0.6,
        rotation: 0,
      },
      {
        id: "sample-storage",
        kind: "wardrobe",
        label: "Storage",
        x: 2.4,
        y: 0.25,
        width: 1,
        depth: 0.4,
        rotation: 0,
      },
    ];
  else if (roomName === "Living & dining")
    layout.items = [
      {
        id: "sample-sofa",
        kind: "sofa",
        label: "Sofa",
        x: 0.5,
        y: 0.4,
        width: 2,
        depth: 0.9,
        rotation: 0,
      },
      {
        id: "sample-table",
        kind: "table",
        label: "Table",
        x: 0.8,
        y: 2,
        width: 1.2,
        depth: 0.6,
        rotation: 0,
      },
    ];
  else if (roomName === "Other space") layout.items = [];
  return layout;
}
export function layoutNotes(room: RoomLayout, unit: PlanUnit, supplied: boolean) {
  const measure = (n: number) => `${displayMeasure(n, unit)} ${unitLabel(unit)}`;
  const issues = analyseLayout(room);
  return [
    "LuxeInfra — room layout for designer review",
    supplied
      ? "Measurements: supplied/confirmed by the visitor; not site-verified."
      : "Measurements: illustrative or unconfirmed. Do not use for ordering or installation.",
    `Rectangular room: ${measure(room.width)} wide × ${measure(room.depth)} deep.`,
    `Chosen front planning gap: ${measure(room.clearance)}; illustrative, not a statutory clearance rule.`,
    "Coordinates start at the top-left of the plan. Furniture sizes below are before rotation.",
    ...room.items.map(
      (item) =>
        `${item.label}: ${measure(item.width)} × ${measure(item.depth)}, left ${measure(item.x)}, top ${measure(item.y)}, rotation ${item.rotation}°.`,
    ),
    ...room.openings.map(
      (opening) =>
        `${opening.kind}: ${opening.wall} wall, offset ${measure(opening.offset)}, width ${measure(opening.width)}.`,
    ),
    "CHECKS",
    ...issues.map((issue) => `${issue.severity.toUpperCase()}: ${issue.message}`),
    !issues.length
      ? "No modeled conflicts found. This is not a construction or fit certification."
      : "Resolve or verify the flagged issues with the designer.",
    "Door reserves are conservative rectangles, not exact swing arcs. Hidden obstacles, heights, services, access through the home and installation tolerances are not verified. Irregular rooms need a floor plan and designer review.",
  ]
    .filter(Boolean)
    .join("\n");
}
