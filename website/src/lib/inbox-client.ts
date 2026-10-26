export type InboxRole = "owner" | "staff";
export type LeadStatus = "new" | "contacted" | "qualified" | "closed";
export type LeadKind = "quote" | "project-brief" | "partner";

export interface InboxUser {
  id: string;
  email: string;
  displayName: string;
  role: InboxRole;
}

export interface InboxSession {
  enabled: boolean;
  authenticated: boolean;
  user?: InboxUser;
  csrfToken?: string;
}

export interface InboxAssignee {
  id: string;
  displayName: string;
  active: boolean;
}

export interface InboxWorkflowCounts {
  today: number;
  overdue: number;
  unscheduled: number;
  unassigned: number;
  mine: number;
}

export interface InboxWorkflow {
  enabled: true;
  canAssign: boolean;
  assignees: { id: string; displayName: string; role: InboxRole }[];
  counts: InboxWorkflowCounts;
  asOf: string;
  timeZone: "Asia/Kolkata";
}

export interface Lead {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  kind: LeadKind;
  name: string;
  phone: string;
  city: string;
  message: string;
  status: LeadStatus;
  notes: string;
  followUpAt: string | null;
  assignedTo?: InboxAssignee | null;
}

export interface InboxSummary {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  closed: number;
  followUpsDue: number;
}

export interface LeadList {
  items: Lead[];
  page: number;
  pageSize: number;
  total: number;
  summary: InboxSummary;
  workflow?: InboxWorkflow;
}

export interface TeamMember extends InboxUser {
  active: boolean;
}

export interface InboxAudit {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  leadReference: string | null;
  targetEmail: string | null;
}

export interface TeamAccess {
  members: TeamMember[];
  audit: InboxAudit[];
}

export const leadStatuses: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
];

export const leadKindLabels: Record<LeadKind, string> = {
  quote: "Quote enquiry",
  "project-brief": "Project brief",
  partner: "Partnership",
};

export class InboxApiError extends Error {
  status: number;
  constructor(status: number) {
    super("The inbox request could not be completed.");
    this.name = "InboxApiError";
    this.status = status;
  }
}

export async function inboxRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    csrfToken?: string;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.csrfToken) headers["X-Luxe-CSRF"] = options.csrfToken;
  const response = await fetch(`/api/admin${path}`, {
    method: options.method || "GET",
    headers,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) throw new InboxApiError(response.status);
  try {
    return (await response.json()) as T;
  } catch {
    throw new InboxApiError(502);
  }
}

export function inboxDate(value: string | null, includeTime = true): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function localDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function inboxError(error: unknown, fallback: string): string {
  if (error instanceof InboxApiError) {
    if (error.status === 429) return "Too many attempts. Please wait a moment and try again.";
    if (error.status === 503)
      return "The inbox is temporarily unavailable. Please try again shortly.";
    if (error.status === 400) return "Please check the details and try again.";
  }
  return fallback;
}
