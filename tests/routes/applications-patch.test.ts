import { describe, it, expect, vi, beforeEach } from "vitest";

const APP_ID = "app-1111-1111-1111-111111111111";
const COMPANY_A = "co-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const COMPANY_B = "co-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function chain(data: unknown, error: unknown = null) {
  const obj: Record<string, unknown> = {};
  (["select", "eq", "update"] as const).forEach((m) => {
    obj[m] = () => obj;
  });
  obj.single = () => Promise.resolve({ data, error });
  obj.maybeSingle = () => Promise.resolve({ data, error });
  return obj;
}

const { mockGetUser, mockClientFrom, mockServiceFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockClientFrom: vi.fn(),
  mockServiceFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockClientFrom,
    }),
  createServiceClient: () =>
    Promise.resolve({
      from: mockServiceFrom,
    }),
}));

const { PATCH } = await import("@/app/api/v1/applications/[id]/route");

function makeRequest(body: unknown) {
  return new Request(`http://localhost/api/v1/applications/${APP_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(id = APP_ID) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => vi.clearAllMocks());

describe("PATCH /api/v1/applications/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await PATCH(makeRequest({ status: "viewed" }), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is a candidate (not employer)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "candidate" }));

    const res = await PATCH(makeRequest({ status: "viewed" }), makeParams());
    expect(res.status).toBe(403);
  });

  it("returns 422 for invalid status value", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockClientFrom.mockReturnValue(chain({ role: "employer" }));

    const res = await PATCH(makeRequest({ status: "hired" }), makeParams()); // "hired" not in enum
    expect(res.status).toBe(422);
  });

  it("IDOR: employer A cannot patch employer B's application (403)", async () => {
    // Employer A belongs to company A. The application's job belongs to company B.
    // The job lookup (job_postings WHERE id=... AND company_id=COMPANY_A) finds nothing → 403.
    mockGetUser.mockResolvedValue({ data: { user: { id: "employer-a" } } });
    mockClientFrom.mockReturnValue(chain({ role: "employer" }));
    mockServiceFrom
      .mockReturnValueOnce(chain({ company_id: COMPANY_A })) // recruiter for employer-a
      .mockReturnValueOnce(chain({ id: APP_ID, job_posting_id: "job-b" })) // application exists
      .mockReturnValue(chain(null)); // job lookup with company_id=COMPANY_A → not found (belongs to B)

    const res = await PATCH(makeRequest({ status: "shortlisted" }), makeParams());
    expect(res.status).toBe(403);
  });

  it("updates status when employer owns the job (200)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "employer-a" } } });
    mockClientFrom.mockReturnValue(chain({ role: "employer" }));
    mockServiceFrom
      .mockReturnValueOnce(chain({ company_id: COMPANY_A })) // recruiter
      .mockReturnValueOnce(chain({ id: APP_ID, job_posting_id: "job-a" })) // application
      .mockReturnValueOnce(chain({ id: "job-a" })) // job owned by company A ✓
      .mockReturnValue(chain({ id: APP_ID, status: "shortlisted" })); // update result

    const res = await PATCH(makeRequest({ status: "shortlisted" }), makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.application.status).toBe("shortlisted");
  });
});
