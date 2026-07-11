// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVED — NOT BUILT
// ─────────────────────────────────────────────────────────────────────────────
// Original path: src/platform/services/global/portfolio.service.ts
//
// The paging + folding logic here is the right shape for the tenant-as-agency
// portfolio rollup. See ../../DESIGN.md for the target SDK shape
// (`req.platform.agency.portfolio.stats()`). Reuse this verbatim but move it
// under `src/platform/services/agency/portfolio.service.ts` when
// re-hydrated, and wrap it in the new `AgencySDK` sub-surface.
// ─────────────────────────────────────────────────────────────────────────────

import { getErixAdapter } from "@erix/lib/erix-adapter";
import type { ErixAdapter, Lead } from "@erix/lib/erix-adapter/types";
import { listClients } from "@platform/services/admin/clients.service";
import { getOrgIdFromClientCode } from "@shared/lib/org-lookup";
import { logger } from "@shared/utils/logger";

const log = logger.child({ module: "PortfolioService" });

/**
 * Cross-tenant intelligence for the freelance/agency dashboard. One
 * operator managing multiple client tenants sees combined totals +
 * per-client breakdown.
 *
 * Runs against the platform Postgres store via the `ErixAdapter`; each
 * per-client aggregation pages through leads via the adapter's keyset
 * cursor and folds totals in memory. Fine for the current freelance-scale
 * (dozens of clients × low-thousands of leads each). If a client ever grows
 * past ~50k leads, promote this to a dedicated
 * `adapter.leads.aggregatePortfolioStats(orgId)` SQL helper.
 */

interface ClientMetrics {
  clientCode: string;
  clientName: string;
  metrics: {
    leads: number;
    pipelineValue: number;
    wonCount: number;
    wonValue: number;
    conversionRate: number;
  };
}

const PAGE_SIZE = 100;
const MAX_PAGES = 500;

async function loadAllLeadsForOrg(
  adapter: ErixAdapter,
  orgId: string,
): Promise<Lead[]> {
  const all: Lead[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await adapter.leads.list(orgId, {
      isArchived: false,
      limit: PAGE_SIZE,
      cursor,
    });
    all.push(...page.items);
    if (!page.nextCursor || page.items.length < PAGE_SIZE) break;
    cursor = page.nextCursor;
  }
  return all;
}

async function computeMetricsForClient(
  clientCode: string,
): Promise<ClientMetrics["metrics"]> {
  const orgId = await getOrgIdFromClientCode(clientCode.toUpperCase());
  if (!orgId) {
    return {
      leads: 0,
      pipelineValue: 0,
      wonCount: 0,
      wonValue: 0,
      conversionRate: 0,
    };
  }

  const adapter = await getErixAdapter(orgId);
  const leads = await loadAllLeadsForOrg(adapter, orgId);

  let pipelineValue = 0;
  let wonCount = 0;
  let wonValue = 0;

  for (const lead of leads) {
    const dealValue = Number(lead.dealValue) || 0;
    pipelineValue += dealValue;
    if (lead.status === "won") {
      wonCount++;
      wonValue += dealValue;
    }
  }

  const total = leads.length;
  return {
    leads: total,
    pipelineValue,
    wonCount,
    wonValue,
    conversionRate: total > 0 ? Math.round((wonCount / total) * 100) : 0,
  };
}

export const PortfolioService = {
  getAgencyStats: async (agencyCode: string) => {
    const clients = await listClients({ agencyCode });

    const results: ClientMetrics[] = await Promise.all(
      clients.map(async (client) => {
        try {
          return {
            clientCode: client.clientCode,
            clientName: client.name,
            metrics: await computeMetricsForClient(client.clientCode),
          };
        } catch (err) {
          log.warn(
            {
              err: (err as Error).message,
              agencyCode,
              clientCode: client.clientCode,
            },
            "Portfolio: skipped client — metrics failed",
          );
          return {
            clientCode: client.clientCode,
            clientName: client.name,
            metrics: {
              leads: 0,
              pipelineValue: 0,
              wonCount: 0,
              wonValue: 0,
              conversionRate: 0,
            },
          };
        }
      }),
    );

    const totals = results.reduce(
      (acc, curr) => {
        acc.totalLeads += curr.metrics.leads;
        acc.totalPipelineValue += curr.metrics.pipelineValue;
        acc.totalWonCount += curr.metrics.wonCount;
        acc.totalWonValue += curr.metrics.wonValue;
        return acc;
      },
      {
        totalLeads: 0,
        totalPipelineValue: 0,
        totalWonCount: 0,
        totalWonValue: 0,
      },
    );

    return {
      agencyCode,
      clientCount: clients.length,
      portfolio: totals,
      breakdown: results,
    };
  },
};
