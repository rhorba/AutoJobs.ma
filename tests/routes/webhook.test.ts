import { describe, it, expect, vi, beforeEach } from "vitest";

const JOB_ID = "job-0000-0000-0000-000000000001";
const COMPANY_ID = "co-0000-0000-0000-000000000001";
const PI_ID = "pi_test_idempotency_123";

function chain(data: unknown, error: unknown = null) {
  const obj: Record<string, unknown> = {};
  (["select", "eq", "insert", "update"] as const).forEach((m) => {
    obj[m] = () => obj;
  });
  obj.single = () => Promise.resolve({ data, error });
  obj.maybeSingle = () => Promise.resolve({ data, error });
  return obj;
}

function makeStripeEvent(overrides: Partial<{
  type: string;
  paymentIntent: string;
  jobId: string;
  companyId: string;
}> = {}) {
  return {
    type: overrides.type ?? "checkout.session.completed",
    data: {
      object: {
        payment_intent: overrides.paymentIntent ?? PI_ID,
        metadata: {
          job_posting_id: overrides.jobId ?? JOB_ID,
          company_id: overrides.companyId ?? COMPANY_ID,
        },
      },
    },
  };
}

const { mockConstructEvent, mockServiceFrom } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockServiceFrom: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
  },
  PRICE_EUR_CENTS: 4500,
  PRICE_MAD: 490,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () =>
    Promise.resolve({
      from: mockServiceFrom,
    }),
}));

const { POST } = await import("@/app/api/v1/payments/webhook/route");

function makeWebhookRequest(body = "stripe-payload", sig = "t=123,v1=abc") {
  return new Request("http://localhost/api/v1/payments/webhook", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/v1/payments/webhook", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new Request("http://localhost/api/v1/payments/webhook", {
      method: "POST",
      body: "payload",
      // no stripe-signature header
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const res = await POST(makeWebhookRequest("bad-payload", "t=bad,v1=bad"));
    expect(res.status).toBe(400);
  });

  it("ignores unrelated event types and returns 200", async () => {
    mockConstructEvent.mockReturnValue(makeStripeEvent({ type: "payment_intent.created" }));

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    // No DB calls should have been made
    expect(mockServiceFrom).not.toHaveBeenCalled();
  });

  it("happy path: activates job and records payment on checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue(makeStripeEvent());
    mockServiceFrom
      .mockReturnValueOnce(chain(null)) // payments.maybeSingle() → no existing record
      .mockReturnValueOnce(chain(null)) // payments.insert()
      .mockReturnValue(chain(null));    // job_postings.update()

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);

    // payments insert was called
    const calls = mockServiceFrom.mock.calls.map((c) => c[0] as string);
    expect(calls).toContain("payments");
    expect(calls).toContain("job_postings");
  });

  it("replay idempotency: returns 200 without duplicating when payment already exists", async () => {
    mockConstructEvent.mockReturnValue(makeStripeEvent());
    // payments.maybeSingle() returns existing record
    mockServiceFrom.mockReturnValue(chain({ id: "pay-existing" }));

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);

    // Should only query payments (idempotency check), then stop — no job_postings update
    const tables = mockServiceFrom.mock.calls.map((c) => c[0] as string);
    expect(tables).not.toContain("job_postings");
  });
});
