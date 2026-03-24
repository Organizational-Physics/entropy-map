import { createHash } from "crypto";
import { query } from "./db";

export interface AuthResult {
  valid: boolean;
  orgId?: string;
  keyId?: string;
  error?: string;
}

export async function validateApiKey(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const key = authHeader.slice(7).trim();
  if (!key) {
    return { valid: false, error: "Empty API key" };
  }

  const keyHash = createHash("sha256").update(key).digest("hex");

  const rows = await query<{ id: string; org_id: string; is_active: boolean }>(
    `SELECT id, org_id, is_active FROM api_keys WHERE key_hash = $1 LIMIT 1`,
    [keyHash]
  );

  if (rows.length === 0) {
    return { valid: false, error: "Invalid API key" };
  }

  const apiKey = rows[0];
  if (!apiKey.is_active) {
    return { valid: false, error: "API key has been revoked" };
  }

  // Update last_used_at async, don't block
  query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [apiKey.id]).catch(() => {});

  return { valid: true, orgId: apiKey.org_id, keyId: apiKey.id };
}
