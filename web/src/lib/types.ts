export type Motion = {
  id: string;
  status: string;
  reason?: string;
  allowed_alternative?: string;
  claim?: string;
  intersection_count?: number;
  batch_id?: string;
};

export type LastRun = {
  org_a: {
    label: string;
    product: string;
    batch: string;
    private_names: string[];
    note: string;
  };
  org_b: {
    label: string;
    product: string;
    batch: string;
    private_count: number;
    note: string;
  };
  motions: Motion[];
  public_record: Array<{
    id: string;
    claim: string;
    intersection_count?: number;
    batch_id?: string;
  }>;
  standing_orders: unknown[];
  audit?: Record<string, number>;
};
