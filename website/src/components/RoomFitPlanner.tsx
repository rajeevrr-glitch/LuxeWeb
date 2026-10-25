import { useId, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Download, Move, Plus, RotateCw, Ruler, Trash2 } from "lucide-react";
import { saveRoomBrief } from "@/lib/visualiser-brief";
import {
  analyseLayout,
  displayMeasure,
  frontZone,
  furnitureTemplates,
  itemRect,
  layoutNotes,
  openingZone,
  sampleLayout,
  toMetres,
  unitLabel,
  type FurnitureKind,
  type Opening,
  type PlanItem,
  type PlanUnit,
  type RoomLayout,
  type Wall,
} from "@/lib/room-layout";

function Measure({
  label,
  value,
  unit,
  onChange,
  min = 0,
  max = 30.48,
}: {
  label: string;
  value: number;
  unit: PlanUnit;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const number = draft === null ? value : toMetres(Number(draft), unit);
  const invalid =
    draft !== null && (!draft.trim() || !Number.isFinite(number) || number < min || number > max);
  return (
    <label className="fit-field">
      <span>
        {label} <small>{unitLabel(unit)}</small>
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={draft ?? displayMeasure(value, unit)}
        aria-invalid={invalid || undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null && !invalid) {
            onChange(number);
            setDraft(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {invalid && (
        <small className="fit-invalid">
          Use {displayMeasure(min, unit)}–{displayMeasure(max, unit)} {unitLabel(unit)}.
        </small>
      )}
    </label>
  );
}

export function RoomFitPlanner() {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<RoomLayout>(() => sampleLayout());
  const [edited, setEdited] = useState(false);
  const [unit, setUnit] = useState<PlanUnit>("feet");
  const [selected, setSelected] = useState("sample-bed");
  const [supplied, setSupplied] = useState(false);
  const [room, setRoom] = useState("Master bedroom");
  const [handoffError, setHandoffError] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  const planner = useRef<HTMLElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const gridId = useId().replace(/:/g, "");
  const items = layout.items;
  const item = items.find((i) => i.id === selected);
  const opening = layout.openings.find((o) => o.id === selected);
  const issues = analyseLayout(layout);
  const problems = issues.filter((i) => i.severity !== "note");
  const change = (update: (old: RoomLayout) => RoomLayout) => {
    setLayout(update);
    setSupplied(false);
    setEdited(true);
  };
  const moveItem = (id: string, values: Partial<PlanItem>) =>
    change((old) => ({
      ...old,
      items: old.items.map((i) => (i.id === id ? { ...i, ...values } : i)),
    }));
  const changeOpening = (id: string, values: Partial<Opening>) =>
    change((old) => ({
      ...old,
      openings: old.openings.map((o) => (o.id === id ? { ...o, ...values } : o)),
    }));
  function add(kind: FurnitureKind) {
    if (items.length >= 16) return;
    const id = crypto.randomUUID();
    const template = furnitureTemplates[kind];
    change((old) => ({
      ...old,
      items: [...old.items, { ...template, id, kind, x: 0.2, y: 0.2, rotation: 0 }],
    }));
    setSelected(id);
  }
  function addOpening(kind: "door" | "window") {
    if (layout.openings.length >= 12) return;
    const id = crypto.randomUUID();
    change((old) => ({
      ...old,
      openings: [
        ...old.openings,
        { id, kind, wall: "south", offset: 0.2, width: kind === "door" ? 0.85 : 1.2 },
      ],
    }));
    setSelected(id);
  }
  const point = (clientX: number, clientY: number) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: p.x / 100, y: p.y / 100 };
  };
  function download() {
    setHandoffError("");
    const invalid = planner.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]');
    if (invalid) {
      invalid.focus();
      setHandoffError("Correct the highlighted measurement before saving or sharing this plan.");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([layoutNotes(layout, unit, supplied)], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "LuxeInfra-room-layout.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function handoff() {
    setHandoffError("");
    const invalid = planner.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]');
    if (invalid) {
      invalid.focus();
      setHandoffError("Correct the highlighted measurement before saving or sharing this plan.");
      return;
    }
    try {
      saveRoomBrief({
        room,
        style: "Help me choose",
        notes: layoutNotes(layout, unit, supplied),
        files: [],
      });
      await navigate({ to: "/project-brief", search: { roomBrief: "1" } });
    } catch {
      setHandoffError(
        "Could not open your project brief. Your layout is still here; you can download it instead.",
      );
    }
  }
  return (
    <section ref={planner} className="wrap fit-planner" aria-labelledby="fit-heading">
      <div className="fit-intro">
        <div>
          <span className="eyebrow">ROOM TO MOVE</span>
          <h2 id="fit-heading">
            A place for everything.
            <br />
            <em>Space to live.</em>
          </h2>
        </div>
        <p>
          Move furniture in a scaled top view. See what overlaps and where access needs attention
          before discussing a layout with your designer.
        </p>
      </div>
      <div className="fit-size-bar" key={unit}>
        <label className="fit-field">
          <span>Your room</span>
          <select
            value={room}
            onChange={(e) => {
              setRoom(e.target.value);
              if (!edited) {
                const next = sampleLayout(e.target.value);
                setLayout(next);
                setSelected(next.items[0]?.id || "");
              }
            }}
          >
            {[
              "Master bedroom",
              "Other bedrooms",
              "Living & dining",
              "Home office",
              "Other space",
            ].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="fit-field">
          <span>Units</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as PlanUnit)}>
            <option value="feet">Feet</option>
            <option value="metres">Metres</option>
          </select>
        </label>
        <Measure
          label="Room width"
          value={layout.width}
          unit={unit}
          min={0.5}
          onChange={(width) => change((old) => ({ ...old, width }))}
        />
        <Measure
          label="Room depth"
          value={layout.depth}
          unit={unit}
          min={0.5}
          onChange={(depth) => change((old) => ({ ...old, depth }))}
        />
      </div>
      <div className="fit-main">
        <div className="fit-canvas-panel">
          <div className="fit-canvas-top">
            <span className={`fit-state ${supplied ? "is-supplied" : ""}`}>
              {supplied ? <Check size={15} /> : <Ruler size={15} />}
              {supplied ? "Your supplied dimensions" : "Illustrative / unconfirmed sizes"}
            </span>
            <span>TOP VIEW · RECTANGULAR ROOM</span>
          </div>
          <svg
            ref={svg}
            className="fit-canvas"
            viewBox={`-55 -55 ${layout.width * 100 + 110} ${layout.depth * 100 + 110}`}
            role="group"
            aria-label="Scaled room plan. Select furniture, drag to move, or use arrow keys. Shaded areas show front access gaps."
            onPointerMove={(e) => {
              if (!drag.current) return;
              const p = point(e.clientX, e.clientY);
              const moving = items.find((i) => i.id === drag.current?.id);
              if (!p || !moving) return;
              const r = itemRect(moving);
              moveItem(moving.id, {
                x: Math.max(
                  0,
                  Math.min(
                    Math.max(0, layout.width - r.width),
                    Math.round((p.x - drag.current.dx) * 20) / 20,
                  ),
                ),
                y: Math.max(
                  0,
                  Math.min(
                    Math.max(0, layout.depth - r.depth),
                    Math.round((p.y - drag.current.dy) * 20) / 20,
                  ),
                ),
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <defs>
              <pattern id={gridId} width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#dcded8" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect
              x="0"
              y="0"
              width={layout.width * 100}
              height={layout.depth * 100}
              fill={`url(#${gridId})`}
              stroke="#233c56"
              strokeWidth="5"
            />
            <text x={layout.width * 50} y="-22" textAnchor="middle" className="fit-dimension">
              {displayMeasure(layout.width, unit)} {unitLabel(unit)}
            </text>
            <text
              transform={`translate(-24 ${layout.depth * 50}) rotate(-90)`}
              textAnchor="middle"
              className="fit-dimension"
            >
              {displayMeasure(layout.depth, unit)} {unitLabel(unit)}
            </text>
            {layout.openings.map((o) => {
              const r = openingZone(o, layout);
              return (
                <g
                  key={o.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${o.kind} on ${o.wall} wall. Select to edit.`}
                  onClick={() => setSelected(o.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(o.id);
                    }
                  }}
                  className="fit-opening"
                >
                  <rect
                    x={r.x * 100}
                    y={r.y * 100}
                    width={r.width * 100}
                    height={r.depth * 100}
                    fill={o.kind === "door" ? "#c6d6e5" : "#d4e5e5"}
                    fillOpacity="0.5"
                    stroke={selected === o.id ? "#173d71" : "#89a0b5"}
                    strokeDasharray="4 3"
                  />
                  <text
                    x={(r.x + r.width / 2) * 100}
                    y={(r.y + r.depth / 2) * 100}
                    textAnchor="middle"
                    className="fit-opening-label"
                  >
                    {o.kind === "door" ? "Door reserve" : "Window"}
                  </text>
                </g>
              );
            })}
            {items.map((i) => {
              const r = itemRect(i);
              const front = frontZone(i, layout.clearance);
              const selectedItem = selected === i.id;
              return (
                <g key={i.id}>
                  <title>{`${i.label}: ${displayMeasure(i.width, unit)} × ${displayMeasure(i.depth, unit)} ${unitLabel(unit)}`}</title>
                  {i.kind !== "column" && i.kind !== "table" && (
                    <rect
                      x={front.x * 100}
                      y={front.y * 100}
                      width={front.width * 100}
                      height={front.depth * 100}
                      fill="#cbd8d1"
                      fillOpacity="0.55"
                      stroke="#a6b6aa"
                      strokeDasharray="4 3"
                      pointerEvents="none"
                    />
                  )}
                  <g
                    tabIndex={0}
                    role="button"
                    className="fit-item"
                    aria-pressed={selectedItem}
                    aria-label={`${i.label}, ${displayMeasure(i.width, unit)} by ${displayMeasure(i.depth, unit)} ${unitLabel(unit)}. Arrow keys move; Shift moves further.`}
                    onFocus={() => setSelected(i.id)}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      const p = point(e.clientX, e.clientY);
                      if (!p) return;
                      setSelected(i.id);
                      drag.current = { id: i.id, dx: p.x - i.x, dy: p.y - i.y };
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onKeyDown={(e) => {
                      const step = e.shiftKey ? 0.25 : 0.05;
                      const moves: Record<string, [number, number]> = {
                        ArrowLeft: [-step, 0],
                        ArrowRight: [step, 0],
                        ArrowUp: [0, -step],
                        ArrowDown: [0, step],
                      };
                      if (moves[e.key]) {
                        e.preventDefault();
                        const [dx, dy] = moves[e.key];
                        moveItem(i.id, { x: Math.max(0, i.x + dx), y: Math.max(0, i.y + dy) });
                      }
                    }}
                  >
                    <rect
                      x={r.x * 100}
                      y={r.y * 100}
                      width={r.width * 100}
                      height={r.depth * 100}
                      rx="3"
                      fill={i.kind === "column" ? "#909898" : selectedItem ? "#c6d5e5" : "#e8ddca"}
                      stroke={selectedItem ? "#173d71" : "#a5957e"}
                      strokeWidth={selectedItem ? 2.5 : 1.5}
                    />
                    {i.kind === "bed" && (
                      <rect
                        x={
                          (r.x +
                            r.width *
                              (i.rotation === 90 ? 0.77 : i.rotation === 270 ? 0.06 : 0.08)) *
                          100
                        }
                        y={
                          (r.y +
                            r.depth *
                              (i.rotation === 180 ? 0.77 : i.rotation === 0 ? 0.06 : 0.08)) *
                          100
                        }
                        width={r.width * (i.rotation === 90 || i.rotation === 270 ? 17 : 84)}
                        height={r.depth * (i.rotation === 90 || i.rotation === 270 ? 84 : 17)}
                        rx="4"
                        fill="#fffaf2"
                        stroke="#b5a993"
                        pointerEvents="none"
                      />
                    )}
                    <text
                      x={(r.x + r.width / 2) * 100}
                      y={(r.y + r.depth / 2) * 100}
                      textAnchor="middle"
                      className="fit-item-label"
                      pointerEvents="none"
                    >
                      {i.label}
                    </text>
                    <text
                      x={(r.x + r.width / 2) * 100}
                      y={(r.y + r.depth / 2) * 100 + 14}
                      textAnchor="middle"
                      className="fit-item-size"
                      pointerEvents="none"
                    >
                      {displayMeasure(r.width, unit)} × {displayMeasure(r.depth, unit)}{" "}
                      {unitLabel(unit)}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
          <p className="fit-canvas-help">
            <Move size={16} /> Drag a piece or select it and use the arrow keys. Green shading is
            your chosen front gap.
          </p>
          <div className="fit-add-bar" aria-label="Add furniture">
            {(Object.keys(furnitureTemplates) as FurnitureKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                disabled={items.length >= 16}
                onClick={() => add(kind)}
              >
                <Plus size={14} />
                {furnitureTemplates[kind].label}
              </button>
            ))}
          </div>
          <div className="fit-add-bar">
            <button
              type="button"
              disabled={layout.openings.length >= 12}
              onClick={() => addOpening("door")}
            >
              <Plus size={14} />
              Door
            </button>
            <button
              type="button"
              disabled={layout.openings.length >= 12}
              onClick={() => addOpening("window")}
            >
              <Plus size={14} />
              Window
            </button>
          </div>
        </div>
        <aside className="fit-inspector" aria-label="Edit selected item">
          <span className="eyebrow">MAKE IT YOUR SPACE</span>
          <h3>
            {item?.label ||
              (opening
                ? `${opening.kind === "door" ? "Door" : "Window"} position`
                : "Choose an item")}
          </h3>
          <label className="fit-field">
            <span>Select a piece or opening</span>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Choose…</option>
              {items.map((i, n) => (
                <option value={i.id} key={i.id}>
                  {i.label} {n + 1}
                </option>
              ))}
              {layout.openings.map((o, n) => (
                <option value={o.id} key={o.id}>
                  {o.kind} {n + 1} · {o.wall}
                </option>
              ))}
            </select>
          </label>
          {item && (
            <>
              <div className="fit-fields" key={item.id + unit}>
                <Measure
                  label="Width"
                  unit={unit}
                  value={item.width}
                  min={0.05}
                  onChange={(width) => moveItem(item.id, { width })}
                />
                <Measure
                  label="Depth"
                  unit={unit}
                  value={item.depth}
                  min={0.05}
                  onChange={(depth) => moveItem(item.id, { depth })}
                />
                <Measure
                  label="From left"
                  unit={unit}
                  value={item.x}
                  onChange={(x) => moveItem(item.id, { x })}
                />
                <Measure
                  label="From top"
                  unit={unit}
                  value={item.y}
                  onChange={(y) => moveItem(item.id, { y })}
                />
              </div>
              <p className="fit-small">
                Size is before rotation. Enter the actual furniture dimensions; starter sizes are
                illustrative.
              </p>
              <button
                className="fit-control"
                type="button"
                onClick={() =>
                  moveItem(item.id, {
                    rotation: ((item.rotation + 90) % 360) as PlanItem["rotation"],
                  })
                }
              >
                <RotateCw size={16} />
                Rotate · {item.rotation}°
              </button>
            </>
          )}
          {opening && (
            <>
              <label className="fit-field">
                <span>Wall</span>
                <select
                  value={opening.wall}
                  onChange={(e) => changeOpening(opening.id, { wall: e.target.value as Wall })}
                >
                  {(["north", "east", "south", "west"] as Wall[]).map((wall) => (
                    <option key={wall}>{wall}</option>
                  ))}
                </select>
              </label>
              <div className="fit-fields" key={opening.id + unit}>
                <Measure
                  label="Opening width"
                  unit={unit}
                  value={opening.width}
                  min={0.1}
                  onChange={(width) => changeOpening(opening.id, { width })}
                />
                <Measure
                  label="Offset along wall"
                  unit={unit}
                  value={opening.offset}
                  onChange={(offset) => changeOpening(opening.id, { offset })}
                />
              </div>
              <p className="fit-small">
                Offset starts at the left of north/south walls and the top of east/west walls. Door
                shading reserves access; actual hinges and swing need checking.
              </p>
            </>
          )}
          {(item || opening) && (
            <button
              type="button"
              className="fit-control"
              onClick={() => {
                change((old) => ({
                  ...old,
                  items: old.items.filter((i) => i.id !== selected),
                  openings: old.openings.filter((o) => o.id !== selected),
                }));
                setSelected("");
              }}
            >
              <Trash2 size={16} />
              Remove selected
            </button>
          )}
          <div className="fit-gap" key={unit}>
            <Measure
              label="Front planning gap"
              unit={unit}
              value={layout.clearance}
              max={2}
              onChange={(clearance) => change((old) => ({ ...old, clearance }))}
            />
            <p className="fit-small">
              A planning preference, not a building-code check. Rotation moves the front gap with
              each piece.
            </p>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              change((old) => ({ ...old, items: [], openings: [] }));
              setSelected("");
            }}
          >
            Clear sample & start empty
          </button>
        </aside>
      </div>
      <div className="fit-review">
        <div>
          <span className="eyebrow">A PRACTICAL FIRST CHECK</span>
          <h3>
            {problems.length
              ? `${problems.length} things to review.`
              : "No modeled conflicts found."}
          </h3>
          <p>
            These checks cover only what you have placed in this rectangular plan. Heights, hidden
            obstacles, exact door swings and installation tolerances still need a designer.
          </p>
          <label className="fit-confirm">
            <input
              type="checkbox"
              checked={supplied}
              onChange={(e) => setSupplied(e.target.checked)}
            />
            I confirm the current dimensions and positions as my inputs. Site measurement is still
            needed.
          </label>
        </div>
        <div className="fit-checks" aria-live="polite">
          {issues.length ? (
            <ul>
              {issues.map((issue, n) => (
                <li key={`${issue.code}-${n}`} className={`fit-issue-${issue.severity}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="fit-check-clear">
              <Check size={20} />
              No furniture overlaps, boundary breaches or blocked modeled access zones were found.
            </p>
          )}
          {!supplied && (
            <p className="fit-assumption">
              The current dimensions are illustrative or unconfirmed. Confirm your inputs before
              treating this as your room.
            </p>
          )}
          <div className="fit-actions">
            <button className="button" type="button" onClick={handoff}>
              Discuss this layout
            </button>
            <button className="text-link" type="button" onClick={download}>
              <Download size={16} />
              Save layout details
            </button>
          </div>
          {handoffError && <p role="alert">{handoffError}</p>}
        </div>
      </div>
      <p className="fit-footnote">
        Irregular room or unsure of the measurements? Save your questions for the designer. This
        tool does not infer room dimensions from a photograph.
      </p>
    </section>
  );
}
