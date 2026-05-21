import * as https from "https";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { TEST_EMPLOYER_EMAIL, TEST_CANDIDATE_EMAIL, TEST_PASSWORD } from "./constants";
export { TEST_EMPLOYER_EMAIL, TEST_CANDIDATE_EMAIL, TEST_PASSWORD } from "./constants";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function apiRequest(method: string, urlPath: string, body?: unknown): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(SUPABASE_URL);
    const payload = body ? JSON.stringify(body) : undefined;
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: urlPath,
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
          Prefer: "return=representation",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode!, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode!, data: raw });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function authAdmin(method: string, urlPath: string, body?: unknown) {
  return apiRequest(method, `/auth/v1/admin${urlPath}`, body);
}

async function rest(table: string, body: unknown) {
  return apiRequest("POST", `/rest/v1/${table}`, body);
}

async function globalSetup() {
  console.log("\n🔧 E2E global setup starting...");

  // ── Employer ──────────────────────────────────────────────────────────────
  const empRes = await authAdmin("POST", "/users", {
    email: TEST_EMPLOYER_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role_type: "employer",
      first_name: "Test",
      last_name: "Recruteur",
      company_name: "E2E Motors",
      city: "Casablanca",
    },
  });

  const empId: string | undefined =
    empRes.data?.id ??
    (empRes.data?.msg?.includes("already been registered") ? undefined : undefined);

  if (!empId && empRes.status !== 422) {
    console.warn("Employer create response:", empRes.status, JSON.stringify(empRes.data));
  }

  let companyId: string | undefined;
  let activeJobId: string | undefined;

  if (empId) {
    await rest("profiles", { id: empId, role: "employer" });

    const compRes = await rest("companies", {
      name: "E2E Motors",
      slug: `e2e-motors-${Date.now()}`,
      city: "Casablanca",
      verified_at: new Date().toISOString(),
    });
    companyId = Array.isArray(compRes.data) ? compRes.data[0]?.id : compRes.data?.id;

    if (companyId) {
      const recRes = await rest("recruiters", {
        user_id: empId,
        company_id: companyId,
        first_name: "Test",
        last_name: "Recruteur",
        is_company_owner: true,
      });
      const recruiterId = Array.isArray(recRes.data) ? recRes.data[0]?.id : recRes.data?.id;

      if (recruiterId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const jobRes = await rest("job_postings", {
          title: "Technicien câblage automobile E2E",
          city: "Kénitra",
          contract_type: "CDI",
          description_fr:
            "Poste de test automatisé. Missions: câblage, assemblage et contrôle qualité sur ligne de production automobile. Expérience requise: 2 ans minimum. Formation BTS Électronique ou équivalent souhaité.",
          company_id: companyId,
          recruiter_id: recruiterId,
          status: "active",
          expires_at: expiresAt.toISOString(),
        });
        activeJobId = Array.isArray(jobRes.data) ? jobRes.data[0]?.id : jobRes.data?.id;
      }
    }
  }

  // ── Candidate ─────────────────────────────────────────────────────────────
  const candRes = await authAdmin("POST", "/users", {
    email: TEST_CANDIDATE_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role_type: "candidate",
      first_name: "Fatima",
      last_name: "Zahra",
      city: "Rabat",
    },
  });

  const candId: string | undefined = candRes.data?.id;

  if (candId) {
    await rest("profiles", { id: candId, role: "candidate" });
    await rest("candidates", {
      user_id: candId,
      first_name: "Fatima",
      last_name: "Zahra",
      city: "Rabat",
      profile_completeness: 85,
      availability: "immediately",
      years_experience: 3,
    });
  }

  const state = { empId, candId, companyId, activeJobId };
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync("test-results/.e2e-state.json", JSON.stringify(state, null, 2));

  console.log("✅ E2E setup complete:", JSON.stringify(state, null, 2));
}

// Only auto-run when executed directly via tsx/node (not when imported)
if (process.argv[1] && (process.argv[1].endsWith("global-setup.ts") || process.argv[1].endsWith("global-setup.js"))) {
  globalSetup().catch((e) => {
    console.error("❌ E2E setup failed:", e);
    process.exit(1);
  });
}

export default globalSetup;
