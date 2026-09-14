import { AuditLogEntry, UserRoleType } from "../types/dms";

export async function computeSHA256(message: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Synchronous simple hash for mock/tests fallback
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}

export async function createAuditEntry(
  prevLog: AuditLogEntry | null,
  actor: { user_id: string; email: string; role_id: UserRoleType },
  action: AuditLogEntry["action"],
  object_type: AuditLogEntry["object_type"],
  object_id: string,
  detail: Record<string, any>
): Promise<AuditLogEntry> {
  const seq = prevLog ? prevLog.seq + 1 : 1;
  const prev_hash = prevLog ? prevLog.row_hash : "0".repeat(64);
  const at = new Date().toISOString();
  const payload = `${seq}|${prev_hash}|${actor.email}|${action}|${object_type}|${object_id}|${at}`;
  const row_hash = await computeSHA256(payload);

  return {
    seq,
    actor_id: actor.user_id,
    actor_email: actor.email,
    actor_role: actor.role_id,
    action,
    object_type,
    object_id,
    detail,
    ip: "10.240.0.45",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "Node.js Server",
    at,
    prev_hash,
    row_hash,
  };
}

export async function verifyAuditChain(logs: AuditLogEntry[]): Promise<{
  valid: boolean;
  brokenIndex: number;
  totalEntries: number;
  errorDetail?: string;
}> {
  if (!logs || logs.length === 0) {
    return { valid: true, brokenIndex: -1, totalEntries: 0 };
  }

  for (let i = 0; i < logs.length; i++) {
    const current = logs[i];
    if (i > 0) {
      const prev = logs[i - 1];
      if (current.prev_hash !== prev.row_hash) {
        return {
          valid: false,
          brokenIndex: i,
          totalEntries: logs.length,
          errorDetail: `Chain rupture at seq #${current.seq}: prev_hash does not match row_hash of seq #${prev.seq}`,
        };
      }
    }

    const payload = `${current.seq}|${current.prev_hash}|${current.actor_email}|${current.action}|${current.object_type}|${current.object_id}|${current.at}`;
    const expected = await computeSHA256(payload);
    if (current.row_hash !== expected) {
      return {
        valid: false,
        brokenIndex: i,
        totalEntries: logs.length,
        errorDetail: `Tamper detected at seq #${current.seq}: cryptographic row_hash does not match stored content`,
      };
    }
  }

  return { valid: true, brokenIndex: -1, totalEntries: logs.length };
}
