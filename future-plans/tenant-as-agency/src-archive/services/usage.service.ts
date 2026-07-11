// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVED — NOT BUILT (likely OBSOLETE)
// ─────────────────────────────────────────────────────────────────────────────
// Original path: src/platform/services/global/usage.service.ts
//
// This was a Mongo-era shim mapping four legacy enum values
// (`whatsapp_msg`, `email_msg`, `ai_token`, `automation_run`) to the
// modern (service, feature) pair used by `platform/services/usage.service.ts`
// + `entitlements.service.ts`.
//
// By the time tenant-as-agency ships, the canonical usage API will be
// `req.platform.billing.usage.record(service, feature, delta)` and
// `req.platform.billing.usage.checkAndIncrement(...)`. This shim only
// deserves resurrection if you find a surviving legacy caller that still
// uses the enum shape — otherwise delete + let the modern API stand.
// ─────────────────────────────────────────────────────────────────────────────

import { entitlementService } from "@platform/services/entitlements.service";
import { usageService as pgUsage } from "@platform/services/usage.service";
import { getOrgIdFromClientCode } from "@shared/lib/org-lookup";
import { logger } from "@shared/utils/logger";

const log = logger.child({ module: "UsageService(legacy)" });

export type LegacyUsageType =
  | "whatsapp_msg"
  | "email_msg"
  | "ai_token"
  | "automation_run";

interface PairResolution {
  service: string;
  feature: string;
}

function resolvePair(type: LegacyUsageType): PairResolution {
  switch (type) {
    case "whatsapp_msg":
      return { service: "erix", feature: "whatsappMessages" };
    case "email_msg":
      return { service: "erix", feature: "emailMessages" };
    case "ai_token":
      return { service: "editor", feature: "aiCalls" };
    case "automation_run":
      return { service: "workflows", feature: "runsPerMonth" };
  }
}

async function resolveLimit(
  orgId: string,
  service: string,
  feature: string,
): Promise<number | "unlimited" | null> {
  try {
    const entitlements = await entitlementService.getEntitlements(orgId);
    const value = entitlements.features?.[service]?.[feature];

    if (value === "unlimited") return "unlimited";
    if (typeof value === "number") return value;
    if (
      value &&
      typeof value === "object" &&
      typeof (value as { limit?: number }).limit === "number"
    ) {
      return (value as { limit: number }).limit;
    }
    return null;
  } catch {
    return null;
  }
}

export const UsageService = {
  consume: async (
    clientCode: string,
    type: LegacyUsageType,
    amount: number = 1,
  ): Promise<boolean> => {
    try {
      const orgId = await getOrgIdFromClientCode(clientCode);
      if (!orgId) {
        log.warn(
          { clientCode, type },
          "consume: org not found — fail-open (counter not incremented)",
        );
        return true;
      }

      const { service, feature } = resolvePair(type);
      const limit = await resolveLimit(orgId, service, feature);

      if (limit === null) {
        await pgUsage.increment(orgId, service, feature, amount);
        return true;
      }

      const result = await pgUsage.checkAndIncrement(
        orgId,
        service,
        feature,
        amount,
        limit,
      );
      return result.allowed;
    } catch (err) {
      log.error(
        { err: (err as Error).message, clientCode, type },
        "consume failed — fail-open",
      );
      return true;
    }
  },

  addCredits: async (
    clientCode: string,
    type: LegacyUsageType,
    amount: number,
  ): Promise<null> => {
    log.warn(
      { clientCode, type, amount },
      "addCredits is deprecated and has no effect; configure entitlements via plans/add-ons instead",
    );
    return null;
  },

  getUsage: async (
    clientCode: string,
  ): Promise<
    Array<{
      type: LegacyUsageType;
      usedCredits: number;
      totalCredits: number;
      status: "active" | "warning" | "exhausted";
      service: string;
      feature: string;
    }>
  > => {
    try {
      const orgId = await getOrgIdFromClientCode(clientCode);
      if (!orgId) return [];

      const periodStart = new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          1,
          0,
          0,
          0,
          0,
        ),
      );

      const types: LegacyUsageType[] = [
        "whatsapp_msg",
        "email_msg",
        "ai_token",
        "automation_run",
      ];

      const out = await Promise.all(
        types.map(async (type) => {
          const { service, feature } = resolvePair(type);
          const [used, limit] = await Promise.all([
            pgUsage.getUsage(orgId, service, feature, periodStart),
            resolveLimit(orgId, service, feature),
          ]);

          const total =
            limit === "unlimited" ? -1 : typeof limit === "number" ? limit : 0;

          let status: "active" | "warning" | "exhausted" = "active";
          if (total > 0) {
            if (used >= total) status = "exhausted";
            else if (used / total > 0.8) status = "warning";
          }

          return {
            type,
            usedCredits: used,
            totalCredits: total,
            status,
            service,
            feature,
          };
        }),
      );

      return out;
    } catch (err) {
      log.error({ err: (err as Error).message, clientCode }, "getUsage failed");
      return [];
    }
  },
};
