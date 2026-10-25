import { useRef, useState } from "react";
import { Crop, X } from "lucide-react";
export type EditArea = { x: number; y: number; width: number; height: number };
export function PhotoAreaSelector({
  src,
  area,
  onChange,
  disabled,
}: {
  src: string;
  area?: EditArea;
  onChange: (area?: EditArea) => void;
  disabled: boolean;
}) {
  const [marking, setMarking] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  function position(x: number, y: number) {
    const r = frame.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (x - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (y - r.top) / r.height)),
    };
  }
  return (
    <div className="photo-area-selector">
      <div
        ref={frame}
        className={`photo-area-frame ${marking && !disabled ? "is-marking" : ""}`}
        onPointerDown={(e) => {
          if (!marking || disabled) return;
          start.current = position(e.clientX, e.clientY);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!start.current || disabled) return;
          const p = position(e.clientX, e.clientY);
          const x = Math.min(0.98, start.current.x, p.x);
          const y = Math.min(0.98, start.current.y, p.y);
          onChange({
            x,
            y,
            width: Math.min(1 - x, Math.max(0.02, Math.abs(p.x - start.current.x))),
            height: Math.min(1 - y, Math.max(0.02, Math.abs(p.y - start.current.y))),
          });
        }}
        onPointerUp={() => {
          start.current = null;
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
      >
        <img src={src} alt="Your complete original room photograph" draggable={false} />
        {area && (
          <span
            className="photo-area-box"
            style={{
              left: `${area.x * 100}%`,
              top: `${area.y * 100}%`,
              width: `${area.width * 100}%`,
              height: `${area.height * 100}%`,
            }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="photo-area-actions">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={marking}
          onClick={() => {
            setMarking(!marking);
            if (!area) onChange({ x: 0.5, y: 0.15, width: 0.4, height: 0.65 });
          }}
        >
          <Crop size={15} />
          {marking ? "Finish marking" : "Mark an area"}
        </button>
        {area && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(undefined);
              setMarking(false);
            }}
          >
            <X size={15} />
            Whole room
          </button>
        )}
      </div>
      {area && (
        <p className="photo-area-note">
          Marked area: {Math.round(area.x * 100)}% from left, {Math.round(area.y * 100)}% from top.
          This guides the edit; surrounding pixels are not locked.
        </p>
      )}
      {marking && !disabled && (
        <div
          className="photo-area-keyboard"
          tabIndex={0}
          role="group"
          aria-label="Move marked area using arrow keys. Hold Shift to resize."
          onKeyDown={(e) => {
            if (!area) return;
            const direction: Record<string, [number, number]> = {
              ArrowLeft: [-0.02, 0],
              ArrowRight: [0.02, 0],
              ArrowUp: [0, -0.02],
              ArrowDown: [0, 0.02],
            };
            if (!direction[e.key]) return;
            e.preventDefault();
            const [dx, dy] = direction[e.key];
            onChange(
              e.shiftKey
                ? {
                    ...area,
                    width: Math.max(0.02, Math.min(1 - area.x, area.width + dx)),
                    height: Math.max(0.02, Math.min(1 - area.y, area.height + dy)),
                  }
                : {
                    ...area,
                    x: Math.max(0, Math.min(1 - area.width, area.x + dx)),
                    y: Math.max(0, Math.min(1 - area.height, area.y + dy)),
                  },
            );
          }}
        >
          Drag a rectangle on the photo, or focus here and use arrow keys to move it. Shift + arrows
          resizes.
        </div>
      )}
    </div>
  );
}
