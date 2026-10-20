const $ = (id) => document.getElementById(id);
let access = "";
let records = [];
let statuses = [];
let current = null;
function message(text) {
  $("message").textContent = text;
}
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: "Bearer " + access, ...options.headers },
  });
  if (response.status === 401) {
    lock();
    throw new Error("Your access code is invalid or expired. Open the desk again.");
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "This action could not be completed.");
  }
  return response;
}
function lock() {
  access = "";
  records = [];
  current = null;
  $("desk").hidden = true;
  $("login").hidden = false;
  $("lock").hidden = true;
  $("detail").close();
  $("list").replaceChildren();
  $("brief-fields").replaceChildren();
  $("room-work").replaceChildren();
  $("references").replaceChildren();
  $("attachments").replaceChildren();
  $("note").value = "";
  $("search").value = "";
  $("code").value = "";
  for (const id of ["detail-title", "reference", "history", "counts", "results", "detail-message"])
    $(id).replaceChildren();
  message("Desk locked.");
}
function fillStages(el, all = false) {
  el.replaceChildren();
  for (const stage of all ? ["All stages", ...statuses] : statuses)
    el.append(new Option(stage, stage));
}
async function refresh() {
  const response = await api("/api/enquiries");
  const data = await response.json();
  records = data.records;
  statuses = data.statuses;
  const filter = $("stage").value;
  fillStages($("stage"), true);
  $("stage").value = statuses.includes(filter) ? filter : "All stages";
  fillStages($("workflow-status"));
  render();
  message(
    data.unreadable
      ? `${data.unreadable} stored request(s) could not be read. Check the private storage folder.`
      : "",
  );
}
function render() {
  const search = $("search").value.toLowerCase().trim();
  const stage = $("stage").value;
  const shown = records.filter(
    (r) =>
      (stage === "All stages" || r.workflow.status === stage) &&
      [r.name, r.city, r.region, r.receipt?.reference].join(" ").toLowerCase().includes(search),
  );
  $("counts").replaceChildren();
  for (const [label, value] of [
    ["All requests", records.length],
    ["New", records.filter((r) => r.workflow.status === "New").length],
    [
      "In conversation",
      records.filter((r) =>
        ["Contacted", "Consultation planned", "Estimate sent"].includes(r.workflow.status),
      ).length,
    ],
    ["Won", records.filter((r) => r.workflow.status === "Won").length],
  ]) {
    const el = node("div");
    el.append(node("strong", String(value)), node("span", label));
    $("counts").append(el);
  }
  $("results").textContent = `${shown.length} ${shown.length === 1 ? "request" : "requests"}`;
  $("list").replaceChildren();
  if (!shown.length) {
    const empty = node("div", undefined, "empty");
    empty.append(
      node(
        "h2",
        records.length ? "No matching conversations." : "Your next conversation will appear here.",
      ),
      node(
        "p",
        records.length
          ? "Try a different search or stage."
          : "Submit a brief through the local website, then refresh this desk.",
      ),
    );
    $("list").append(empty);
  }
  for (const r of shown) {
    const card = node("article", undefined, "card");
    card.append(
      node("span", r.workflow.status, "badge"),
      node("h2", r.name),
      node("p", `${r.city}, ${r.region}`),
      node("p", `${r.scope} · ${r.budget}`),
      node(
        "small",
        `${r.receipt?.reference || r.id} · ${new Date(r.receivedAt).toLocaleDateString()}`,
      ),
    );
    const button = node("button", "Review brief →");
    button.addEventListener("click", () => open(r));
    card.append(button);
    $("list").append(card);
  }
}
function field(label, value) {
  const box = node("div");
  box.append(node("small", label), node("p", value || "Not provided"));
  $("brief-fields").append(box);
}
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = node("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function open(r) {
  current = r;
  $("detail-title").textContent = r.name;
  $("reference").textContent = r.receipt?.reference || r.id;
  $("detail-message").textContent = "";
  $("brief-fields").replaceChildren();
  for (const [label, value] of [
    ["Location", r.city + ", " + r.region],
    ["Home", `${r.property} · ${r.configuration || "Not sure"} · ${r.condition}`],
    ["Site readiness", r.readiness || "To discuss"],
    ["Carpet area", r.area ? `${r.area} sq ft` : "Not provided"],
    ["Phone", r.phone],
    ["Email", r.email],
    ["Preferred contact", `${r.method} · ${r.time}`],
    ["Style", r.style],
    ["Priorities", (r.priorities || []).join(", ")],
    ["Budget preference", r.budget],
    ["Desired timing", r.timing],
    ["Customer notes", r.notes],
  ])
    field(label, value);
  $("room-work").replaceChildren();
  for (const room of r.rooms || [])
    $("room-work").append(
      node("p", `${room}: ${(r.work?.[room] || []).join(", ") || "Please advise"}`),
    );
  $("references").replaceChildren();
  for (const idea of r.inspirations || [])
    $("references").append(node("p", `${idea.id} — ${idea.title}`));
  if (!r.inspirations?.length) $("references").append(node("p", "No saved design references."));
  $("attachments").replaceChildren();
  for (const file of r.files || []) {
    const button = node("button", `Download ${file.originalName}`, "secondary");
    button.addEventListener("click", async () => {
      try {
        button.disabled = true;
        const response = await api(`/api/enquiries/${r.id}/files/${file.filename}`);
        saveBlob(await response.blob(), file.originalName);
      } catch (e) {
        $("detail-message").textContent = e.message;
      } finally {
        button.disabled = false;
      }
    });
    $("attachments").append(button);
  }
  if (!r.files?.length) $("attachments").append(node("p", "No attachments."));
  $("workflow-status").value = r.workflow.status;
  $("note").value = r.workflow.note || "";
  history(r);
  $("detail").showModal();
}
function history(r) {
  $("history").replaceChildren();
  for (const item of [...(r.workflow.history || [])].reverse())
    $("history").append(
      node("p", `${new Date(item.at).toLocaleString()} · ${item.from} → ${item.to}`),
    );
}
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  access = $("code").value.trim();
  $("code").value = "";
  try {
    await refresh();
    $("login").hidden = true;
    $("desk").hidden = false;
    $("lock").hidden = false;
  } catch (error) {
    message(error.message);
  }
});
$("lock").addEventListener("click", lock);
$("refresh").addEventListener("click", () => refresh().catch((e) => message(e.message)));
$("search").addEventListener("input", render);
$("stage").addEventListener("change", render);
$("close").addEventListener("click", () => $("detail").close());
$("workflow-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!current) return;
  $("save").disabled = true;
  $("detail-message").textContent = "Saving…";
  try {
    const response = await api(`/api/enquiries/${current.id}/workflow`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: $("workflow-status").value,
        note: $("note").value,
        version: current.workflow.version || 0,
      }),
    });
    current.workflow = await response.json();
    history(current);
    render();
    $("detail-message").textContent = "Follow-up saved. No notification was sent.";
  } catch (error) {
    $("detail-message").textContent = error.message;
  } finally {
    $("save").disabled = false;
  }
});
$("download").addEventListener("click", () => {
  if (!current) return;
  const { fingerprint, workflow, notification, files, website, ...brief } = current;
  saveBlob(
    new Blob(
      [
        JSON.stringify(
          { ...brief, attachments: (files || []).map((f) => f.originalName) },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
    (current.receipt?.reference || "LuxeInfra-brief") + ".json",
  );
});
