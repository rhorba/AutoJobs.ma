import { describe, it, expect, vi, beforeEach } from "vitest";

const JOB_ID = "550e8400-e29b-41d4-a716-446655440001";

// Chainable Supabase query mock: supports .select().eq().single() and .insert().select().single()
function chain(data: unknown, error: unknown = null) {
  const obj: Record<string, unknown> = {};
  (["select", "eq", "insert", "update"] as const).forEach((m) => {
    obj[m] = () => obj;
  });
  obj.single = () => Promise.resolve({ data, error });
  obj.maybeSingle = () => Promise.resolve({ data, error });
  return obj;
}

const {
  mockGetUser,
  mockClientFrom,
  mockServiceFrom,
  mockServiceAdminGetUser,
  mockResendSend,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockClientFrom: vi.fn(),
  mockServiceFrom: vi.fn(),
  mockServiceAdminGetUser: vi.fn(),
  mockResendSend: vi.fn().mockResolvedValue({ id: "email-ok" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockClientFrom,
    }),
  createServiceClient: () =>
    Promise.resolve({
      auth: { admin: { getUserById: mockServiceAdminGetUser } },
      from: mockServiceFrom,
    }),
}));

vi.mock("@/lib/resend", () => ({
  resend: { emails: { send: mockResendSend } },
  FROM_EMAIL: "noreply@autojobs.ma",
}));

// Import after mocks are set up
const { POST } = await import("@/app/api/v1/applications/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/v1/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResendSend.mockResolvedValue({ id: "email-ok" });
  mockServiceAdminGetUser.mockResolvedValue({ data: { user: { email: "u@test.com" } } });
});

describe("POST /api/v1/applications", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({ job_id: JOB_ID }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a candidate (employer role)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "employer" }));

    const res = await POST(makeRequest({ job_id: JOB_ID }));
    expect(res.status).toBe(403);
  });

  it("returns 422 for invalid body (missing job_id)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "candidate" }));

    const res = await POST(makeRequest({ cover_note: "Hello" }));
    expect(res.status).toBe(422);
  });

  it("returns 403 when profile completeness < 80", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "candidate" }));
    mockServiceFrom.mockReturnValue(
      chain({ id: "c1", profile_completeness: 60, first_name: "A", last_name: "B", city: "C" })
    );

    const res = await POST(makeRequest({ job_id: JOB_ID }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toMatch(/80%/);
  });

  it("returns 410 when job is expired", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "candidate" }));
    mockServiceFrom
      .mockReturnValueOnce(
        chain({ id: "c1", profile_completeness: 90, first_name: "Ali", last_name: "Benali", city: "Kenitra" })
      )
      .mockReturnValue(
        chain({
          id: JOB_ID,
          title: "Ingénieur",
          city: "Kenitra",
          expires_at: "2020-01-01T00:00:00Z",
          company_id: "co1",
          recruiter_id: "r1",
        })
      );

    const res = await POST(makeRequest({ job_id: JOB_ID }));
    expect(res.status).toBe(410);
  });

  it("returns 409 on duplicate application", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "candidate" }));
    mockServiceFrom
      .mockReturnValueOnce(
        chain({ id: "c1", profile_completeness: 90, first_name: "Ali", last_name: "Benali", city: "Kenitra" })
      )
      .mockReturnValueOnce(
        chain({ id: JOB_ID, title: "Ingénieur", city: "Kenitra", expires_at: null, company_id: "co1", recruiter_id: "r1" })
      )
      .mockReturnValue(chain({ id: "app-existing" })); // existing application

    const res = await POST(makeRequest({ job_id: JOB_ID }));
    expect(res.status).toBe(409);
  });

  it("returns 201 with application on happy path", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "candidate" }));
    mockServiceFrom
      .mockReturnValueOnce(
        chain({ id: "c1", profile_completeness: 90, first_name: "Ali", last_name: "Benali", city: "Kenitra" })
      )
      .mockReturnValueOnce(
        chain({ id: JOB_ID, title: "Ingénieur", city: "Kenitra", expires_at: null, company_id: "co1", recruiter_id: "r1" })
      )
      .mockReturnValueOnce(chain(null)) // no existing application
      .mockReturnValueOnce(chain({ id: "app-new", status: "submitted", job_posting_id: JOB_ID, candidate_id: "c1" }))
      .mockReturnValue(chain({ first_name: "Jean", user_id: "rec-uid", name: "Gotion Morocco" })); // email-related

    const res = await POST(makeRequest({ job_id: JOB_ID, cover_note: "Motivé!" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.application.id).toBe("app-new");
    expect(body.data.application.status).toBe("submitted");
  });
});
