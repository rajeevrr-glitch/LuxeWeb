export const comparisonFocus = [
  "Layout",
  "Colour palette",
  "Storage approach",
  "Lighting",
  "Overall mood",
] as const;

export type ComparisonFocus = (typeof comparisonFocus)[number];
export type DesignComparison = {
  ids: string[];
  preferences: Record<string, ComparisonFocus[]>;
};

const comparisonKey = "luxeinfra-design-comparison-v1";

export function sanitiseDesignComparison(
  value: unknown,
  validIds: readonly string[],
): DesignComparison {
  const input = value && typeof value === "object" ? value : {};
  const stored = input as { ids?: unknown; preferences?: unknown };
  const valid = new Set(validIds);
  const ids = Array.isArray(stored.ids)
    ? [
        ...new Set(
          stored.ids.filter((id): id is string => typeof id === "string" && valid.has(id)),
        ),
      ].slice(0, 3)
    : [];
  const preferences: DesignComparison["preferences"] = {};
  const choices = stored.preferences;
  if (choices && typeof choices === "object" && !Array.isArray(choices)) {
    for (const id of validIds) {
      const selected = Object.prototype.hasOwnProperty.call(choices, id)
        ? (choices as Record<string, unknown>)[id]
        : undefined;
      if (!Array.isArray(selected)) continue;
      const safe = comparisonFocus.filter((focus) => selected.includes(focus));
      if (safe.length) preferences[id] = safe;
    }
  }
  return { ids, preferences };
}

export function readDesignComparison(
  validIds: readonly string[],
  initialIds: readonly string[] = [],
): DesignComparison {
  try {
    const stored = localStorage.getItem(comparisonKey);
    return sanitiseDesignComparison(
      stored === null ? { ids: initialIds } : JSON.parse(stored),
      validIds,
    );
  } catch {
    return { ids: [], preferences: {} };
  }
}

export function saveDesignComparison(value: DesignComparison, validIds: readonly string[]) {
  const safe = sanitiseDesignComparison(value, validIds);
  localStorage.setItem(comparisonKey, JSON.stringify(safe));
  return safe;
}

export function describeDesignComparison(
  comparison: DesignComparison,
  catalogue: readonly { id: string; title: string }[],
  notes: Record<string, string> = {},
) {
  const safe = sanitiseDesignComparison(
    comparison,
    catalogue.map((item) => item.id),
  );
  return safe.ids
    .map((id) => {
      const item = catalogue.find((idea) => idea.id === id)!;
      const focus = safe.preferences[id] || [];
      const note = typeof notes[id] === "string" ? notes[id].trim().slice(0, 180) : "";
      return [
        `${item.title} (ref: ${item.id})`,
        focus.length ? `What I like: ${focus.join(", ")}` : "",
        note ? `My note: ${note}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}
