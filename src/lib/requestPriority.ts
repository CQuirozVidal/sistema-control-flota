export type RequestPriorityKey =
  | "urgent"
  | "high"
  | "medium_high"
  | "low"
  | "very_low"
  | "undefined";

export type RequestPriorityInfo = {
  key: RequestPriorityKey;
  label: string;
  rank: number;
  badgeClassName: string;
  singularSummaryLabel: string;
  summaryLabel: string;
};

const PRIORITY_INFO: Record<RequestPriorityKey, RequestPriorityInfo> = {
  urgent: {
    key: "urgent",
    label: "Urgente",
    rank: 0,
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    singularSummaryLabel: "urgente",
    summaryLabel: "urgentes",
  },
  high: {
    key: "high",
    label: "Alta",
    rank: 1,
    badgeClassName: "border-warning/20 bg-warning/10 text-warning",
    singularSummaryLabel: "alta",
    summaryLabel: "altas",
  },
  medium_high: {
    key: "medium_high",
    label: "Media alta",
    rank: 2,
    badgeClassName: "border-orange-500/20 bg-orange-500/10 text-orange-600",
    singularSummaryLabel: "media alta",
    summaryLabel: "media alta",
  },
  low: {
    key: "low",
    label: "Baja",
    rank: 3,
    badgeClassName: "border-sky-500/20 bg-sky-500/10 text-sky-600",
    singularSummaryLabel: "baja",
    summaryLabel: "bajas",
  },
  very_low: {
    key: "very_low",
    label: "Muy baja",
    rank: 4,
    badgeClassName: "border-muted bg-muted text-muted-foreground",
    singularSummaryLabel: "muy baja",
    summaryLabel: "muy bajas",
  },
  undefined: {
    key: "undefined",
    label: "Sin prioridad definida",
    rank: 5,
    badgeClassName: "border-border bg-secondary text-secondary-foreground",
    singularSummaryLabel: "sin prioridad definida",
    summaryLabel: "sin prioridad definida",
  },
};

const REQUEST_TYPE_PRIORITY_MAP: Record<string, RequestPriorityKey> = {
  combustible: "urgent",
  mantencion: "high",
  repuestos: "medium_high",
  prestamo: "low",
  anticipo: "very_low",
};

const PRIORITY_ORDER: RequestPriorityKey[] = [
  "urgent",
  "high",
  "medium_high",
  "low",
  "very_low",
  "undefined",
];

export function normalizeRequestTypeName(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getRequestPriorityInfo(requestTypeName?: string | null): RequestPriorityInfo {
  const normalized = normalizeRequestTypeName(requestTypeName);
  const key = REQUEST_TYPE_PRIORITY_MAP[normalized] ?? "undefined";
  return PRIORITY_INFO[key];
}

export function sortRequestsByPriority<T>(
  requests: T[],
  getRequestTypeName: (request: T) => string | null | undefined,
  getCreatedAt?: (request: T) => string | null | undefined,
) {
  return [...requests].sort((left, right) => {
    const leftPriority = getRequestPriorityInfo(getRequestTypeName(left));
    const rightPriority = getRequestPriorityInfo(getRequestTypeName(right));

    if (leftPriority.rank !== rightPriority.rank) {
      return leftPriority.rank - rightPriority.rank;
    }

    if (!getCreatedAt) {
      return 0;
    }

    const leftDate = new Date(getCreatedAt(left) ?? 0).getTime();
    const rightDate = new Date(getCreatedAt(right) ?? 0).getTime();

    return rightDate - leftDate;
  });
}

export function buildRequestPriorityBreakdown<T>(
  requests: T[],
  getRequestTypeName: (request: T) => string | null | undefined,
) {
  const grouped = new Map<RequestPriorityKey, { info: RequestPriorityInfo; count: number; types: Set<string> }>();

  for (const request of requests) {
    const requestTypeName = getRequestTypeName(request) ?? "Sin tipo";
    const info = getRequestPriorityInfo(requestTypeName);
    const existing = grouped.get(info.key);

    if (existing) {
      existing.count += 1;
      existing.types.add(requestTypeName);
      continue;
    }

    grouped.set(info.key, {
      info,
      count: 1,
      types: new Set([requestTypeName]),
    });
  }

  return PRIORITY_ORDER
    .map((key) => grouped.get(key))
    .filter((item): item is { info: RequestPriorityInfo; count: number; types: Set<string> } => Boolean(item))
    .map((item) => ({
      ...item.info,
      count: item.count,
      types: [...item.types].sort((left, right) => left.localeCompare(right, "es")),
      summaryText: `${item.count} ${item.count === 1 ? item.info.singularSummaryLabel : item.info.summaryLabel} (${[...item.types]
        .sort((left, right) => left.localeCompare(right, "es"))
        .join(", ")})`,
    }));
}
