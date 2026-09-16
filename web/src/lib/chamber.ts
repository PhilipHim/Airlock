export type ChamberPreview = {
  allowed: boolean;
  reason: string | null;
  allowed_alternative: string | null;
  payload: Record<string, unknown>;
  keys: string[];
  prohibited_fields: string[];
  extra_fields: string[];
  identity_hits: string[];
  identifier_hits: string[];
  dropped_fields: string[];
  kept_fields: string[];
  outgoing: Record<string, unknown>;
  file_return: Record<string, unknown> | null;
  decision: {
    blocked?: boolean;
    reason?: string | null;
    allowed_alternative?: string | null;
  };
  blocked_motion: Record<string, unknown> | null;
  agent_b_can_second: boolean;
  agent_b_has_batch: boolean;
  ask?: "endeavor" | null;
  model?: string;
  draft?: string;
  ask_error?: string | null;
};

export type InboxItem = {
  id: string;
  claim: string;
  status: "arrived" | "closed";
  payload: Record<string, unknown>;
};

export const PRESETS = [
  {
    id: "name",
    label: "Name",
    text: "Anna Müller returned the earbuds. Battery swollen.",
  },
  {
    id: "return",
    label: "Return",
    text: "A customer returned the earbuds. Battery swollen.",
    payload: {
      id: "m2",
      from_org: "org_a",
      org_id: "org_a",
      batch_id: "BAT-042",
      product_type: "wireless earbuds",
      risk_level: "high",
      claim: "A customer returned the earbuds. Battery swollen.",
    },
  },
  {
    id: "ids",
    label: "IDs",
    text: "Customer C-1001 returned the earbuds. Battery swollen.",
  },
] as const;

export const ENDEAVOR_PROOF = {
  label: "Flower Endeavor 1.0",
  run: "9109147444896690527",
  model: "flower-endeavor-v1.0",
} as const;

export const SUPERGRID_COMMAND =
  "uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.model=\"flower-endeavor-v1.0\" agent.input=\"move\"' --stream";
