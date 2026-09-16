/** Same policy as agent/gate.py. Runs in Next so Vercel does not need uv. */

const ALLOWED_FIELDS = new Set([
  "org_id",
  "batch_id",
  "product_type",
  "aggregate_count",
  "risk_level",
  "supplier_id",
  "component_id",
  "allowed_alternative",
  "blocked",
  "reason",
  "id",
  "claim",
  "status",
  "from_org",
  "motion_id",
  "seconded",
]);

const PROHIBITED_FIELDS = new Set([
  "customer_name",
  "customer_address",
  "customer_id",
  "email",
  "phone",
  "name",
  "address",
  "names",
  "addresses",
  "customer_ids",
  "customers",
]);

const IDENTITY_MARKERS = [
  "anna müller",
  "anna mueller",
  "anna muller",
  "müller",
  "mueller",
  "peter schmidt",
  "schmidt",
  "leila hassan",
  "hassan",
  "jonas weber",
  "weber",
  "rollbergstraße 12, berlin",
  "rollbergstrasse 12, berlin",
  "sonnenallee 8, berlin",
  "kottbusser damm 4, berlin",
  "karl-marx-straße 1, berlin",
  "karl-marx-strasse 1, berlin",
];

const RAW_ID_MARKERS = ["c-1001", "c-1002", "c-1003", "c-1099"];
const SHAREABLE_ID_PREFIXES = new Set(["bat", "sup", "cell"]);
const NAME_WORD =
  /[A-ZÄÖÜÁÉÍÓÚÀÈÌÒÙÑ][a-zäöüßáéíóúàèìòùñç]+(?:['’-][A-Za-zÄÖÜäöüßÁÉÍÓÚáéíóúÑñç]+)*/g;
const ID_TOKEN = /\b([A-Za-z]{1,4})-(\d{3,})\b/g;
const NOT_NAME_WORDS = new Set([
  "the",
  "and",
  "for",
  "from",
  "with",
  "this",
  "that",
  "returned",
  "return",
  "returns",
  "customer",
  "customers",
  "agent",
  "file",
  "batch",
  "shared",
  "write",
  "wireless",
  "earbuds",
  "battery",
  "swollen",
  "retailer",
  "supplier",
  "product",
  "claim",
  "status",
  "identity",
  "disclosure",
  "private",
  "record",
  "high",
  "medium",
  "low",
  "risk",
  "screen",
  "cracked",
  "items",
]);

export type GateDecision = {
  allowed: boolean;
  reason: string | null;
  allowed_alternative: string | null;
  payload: Record<string, unknown>;
};

function walkKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(walkKeys);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
      key.toLowerCase(),
      ...walkKeys(nested),
    ]);
  }
  return [];
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") return "";
  return JSON.stringify(value).toLowerCase();
}

function walkStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(walkStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(walkStrings);
  }
  return [];
}

function nameHits(text: string): string[] {
  const matches = [...text.matchAll(NAME_WORD)];
  const hits: string[] = [];
  let index = 0;
  while (index < matches.length) {
    const run = [matches[index]];
    let cursor = index + 1;
    while (cursor < matches.length) {
      const prev = run[run.length - 1];
      const next = matches[cursor];
      const gap = text.slice(prev.index! + prev[0].length, next.index);
      if (gap.trim() !== "") break;
      run.push(next);
      cursor += 1;
    }
    if (run.length >= 2) {
      const tokens = run.map((match) => match[0]);
      if (!tokens.some((token) => NOT_NAME_WORDS.has(token.toLowerCase()))) {
        hits.push(tokens.join(" "));
      }
    }
    index += run.length;
  }
  return [...new Set(hits)];
}

function idHits(text: string): string[] {
  const hits: string[] = [];
  for (const match of text.matchAll(ID_TOKEN)) {
    if (SHAREABLE_ID_PREFIXES.has(match[1].toLowerCase())) continue;
    hits.push(match[0]);
  }
  return [...new Set(hits)];
}

export function findIdentity(value: unknown): string[] {
  const found: string[] = [];
  const blob = asText(value);
  for (const marker of IDENTITY_MARKERS) {
    if (blob.includes(marker)) found.push(marker);
  }
  for (const text of walkStrings(value)) {
    for (const hit of nameHits(text)) found.push(hit.toLowerCase());
  }
  return [...new Set(found)];
}

export function findIdentifiers(value: unknown): string[] {
  const found: string[] = [];
  const blob = asText(value);
  for (const marker of RAW_ID_MARKERS) {
    if (blob.includes(marker)) found.push(marker);
  }
  for (const text of walkStrings(value)) {
    for (const hit of idHits(text)) found.push(hit.toLowerCase());
  }
  return [...new Set(found)];
}

function dropProhibited(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dropProhibited);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (PROHIBITED_FIELDS.has(key.toLowerCase())) continue;
      out[key] = dropProhibited(nested);
    }
    return out;
  }
  return value;
}

function hasShareable(payload: Record<string, unknown>): boolean {
  if (payload.batch_id || payload.product_type || payload.risk_level) return true;
  if (typeof payload.claim === "string" && payload.claim.trim()) return true;
  return payload.aggregate_count != null;
}

function identityReason(prohibited: string[]): string {
  if (prohibited.some((key) => key === "customer_id" || key === "customer_ids")) {
    return "RAW_IDENTIFIERS";
  }
  if (
    prohibited.some((key) =>
      ["customer_name", "name", "names", "customers"].includes(key),
    )
  ) {
    return "IDENTITY_DISCLOSURE";
  }
  return "PROHIBITED_FIELDS";
}

export function redactClaim(claim: string): string {
  const slot = "a customer";
  let text = claim;
  const markers = [
    ...new Set([
      ...findIdentifiers(claim),
      ...findIdentity(claim),
      ...idHits(claim),
      ...nameHits(claim),
    ]),
  ];
  for (const marker of markers.sort((a, b) => b.length - a.length)) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`\\bcustomer\\s+${escaped}\\b`, "ig"), slot);
    text = text.replace(new RegExp(escaped, "ig"), slot);
  }
  text = text.replace(new RegExp(`(?:${slot})(?:\\s+and\\s+${slot})+`, "ig"), "customers");
  text = text.replace(new RegExp(`(?:${slot})(?:\\s+${slot})+`, "ig"), slot);
  text = text.replace(/\s+/g, " ").replace(/\s+([.,;:])/g, "$1").replace(/^[ ,;:]+|[ ,;:]+$/g, "");
  if (!text) return "";
  return text[0].toUpperCase() + text.slice(1);
}

export function inspect(payload: Record<string, unknown>): GateDecision {
  const keys = walkKeys(payload);
  const prohibited = keys.filter((key) => PROHIBITED_FIELDS.has(key));
  const cleanedRaw = dropProhibited(payload);
  const cleaned =
    cleanedRaw && typeof cleanedRaw === "object" && !Array.isArray(cleanedRaw)
      ? (cleanedRaw as Record<string, unknown>)
      : {};

  if (findIdentity(cleaned).length) {
    return {
      allowed: false,
      reason: "IDENTITY_DISCLOSURE",
      allowed_alternative: "batch_return",
      payload: {},
    };
  }
  if (findIdentifiers(cleaned).length) {
    return {
      allowed: false,
      reason: "RAW_IDENTIFIERS",
      allowed_alternative: "batch_return",
      payload: {},
    };
  }
  const extra = walkKeys(cleaned).filter((key) => !ALLOWED_FIELDS.has(key));
  if (extra.length) {
    return {
      allowed: false,
      reason: "PROHIBITED_FIELDS",
      allowed_alternative: "aggregate_count",
      payload: {},
    };
  }
  if (prohibited.length && !hasShareable(cleaned)) {
    return {
      allowed: false,
      reason: identityReason(prohibited),
      allowed_alternative: "batch_return",
      payload: {},
    };
  }
  if (prohibited.length) {
    return {
      allowed: true,
      reason: null,
      allowed_alternative: null,
      payload: cleaned,
    };
  }
  return {
    allowed: true,
    reason: null,
    allowed_alternative: null,
    payload,
  };
}

export function scan(payload: Record<string, unknown>) {
  const decision = inspect(payload);
  const keys = walkKeys(payload);
  const prohibited = [...new Set(keys.filter((key) => PROHIBITED_FIELDS.has(key)))].sort();
  const extra = [
    ...new Set(
      keys.filter((key) => !ALLOWED_FIELDS.has(key) && !PROHIBITED_FIELDS.has(key)),
    ),
  ].sort();
  return {
    allowed: decision.allowed,
    reason: decision.reason,
    allowed_alternative: decision.allowed_alternative,
    payload: decision.allowed ? decision.payload : {},
    keys,
    prohibited_fields: prohibited,
    extra_fields: extra,
    identity_hits: findIdentity(payload),
    identifier_hits: findIdentifiers(payload),
    dropped_fields: [...new Set([...prohibited, ...extra])].sort(),
    kept_fields: decision.allowed ? Object.keys(decision.payload).sort() : [],
  };
}

export const SHAREABLE_RETURN: Record<string, unknown> = {
  id: "m2",
  from_org: "org_a",
  org_id: "org_a",
  batch_id: "BAT-042",
  product_type: "wireless earbuds",
  risk_level: "high",
  claim: "A customer returned the earbuds. Battery swollen.",
};
