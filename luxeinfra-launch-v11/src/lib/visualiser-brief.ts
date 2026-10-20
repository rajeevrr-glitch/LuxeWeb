// Photos stay in this tab's memory until the user explicitly submits the planner.
type RoomBrief = { room: string; style: string; notes: string; files: File[] };
let pending: (RoomBrief & { expiresAt: number }) | null = null;
export function saveRoomBrief(brief: RoomBrief) {
  pending = { ...brief, expiresAt: Date.now() + 30 * 60 * 1000 };
}
export function takeRoomBrief(): RoomBrief | null {
  const brief = pending;
  pending = null;
  return brief && brief.expiresAt > Date.now() ? brief : null;
}
