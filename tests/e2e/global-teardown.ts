import * as https from "https";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function deleteUser(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(SUPABASE_URL);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: `/auth/v1/admin/users/${userId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
        },
      },
      (res) => {
        res.resume();
        res.on("end", resolve);
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function globalTeardown() {
  console.log("\n🧹 E2E teardown starting...");
  try {
    const raw = fs.readFileSync("test-results/.e2e-state.json", "utf-8").replace(/^﻿/, "");
    const state = JSON.parse(raw);
    if (state.empId) await deleteUser(state.empId);
    if (state.candId) await deleteUser(state.candId);
    console.log("✅ E2E teardown complete — test users deleted");
  } catch (e) {
    console.warn("Teardown warning:", e);
  }
}

globalTeardown().catch((e) => console.error("❌ Teardown error:", e));
