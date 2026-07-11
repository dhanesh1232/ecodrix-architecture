// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVED — NOT BUILT
// ─────────────────────────────────────────────────────────────────────────────
// Original path: src/platform/services/global/health.service.ts
//
// Two methods here — split them on re-hydration:
//   - `checkPortfolioHealth(agencyCode?)` → agency-only, moves under
//     `req.platform.agency.portfolio.health()` when tenant-as-agency ships.
//   - `checkClientReadiness(clientCode)` → single-tenant, useful for admin
//     support tooling independent of agency mode. Move under
//     `req.platform.admin.clients.readiness(codeOrId)` if needed sooner.
// ─────────────────────────────────────────────────────────────────────────────

import { getErixAdapter } from "@erix/lib/erix-adapter";
import { listClients } from "@platform/services/admin/clients.service";
import { getOrgIdFromClientCode } from "@shared/lib/org-lookup";

export const HealthService = {
  checkPortfolioHealth: async (agencyCode?: string) => {
    const clients = await listClients({ agencyCode });

    const report = [];

    for (const client of clients) {
      const clientHealth: any = {
        clientCode: client.clientCode,
        name: client.name,
        issues: [],
      };

      if (
        client.whatsapp?.enabled &&
        client.whatsapp.status === "disconnected"
      ) {
        clientHealth.issues.push({
          type: "whatsapp_disconnect",
          severity: "error",
          message: "WhatsApp instance is disconnected.",
        });
      }

      if (clientHealth.issues.length > 0) {
        report.push(clientHealth);
      }
    }

    return report;
  },

  checkClientReadiness: async (clientCode: string) => {
    const orgId = await getOrgIdFromClientCode(clientCode.toUpperCase());
    if (!orgId) {
      return {
        clientCode,
        counts: { pipelines: 0, stages: 0, rules: 0 },
        isReady: false,
        suggestion: "Deploy a CRM Blueprint to get started.",
      };
    }
    const adapter = await getErixAdapter(orgId);

    const pipelineList = await adapter.pipelines.list(orgId);
    const stageCounts = await Promise.all(
      pipelineList.map((p) => adapter.pipelines.listStages(orgId, p.id)),
    );

    const pipelines = pipelineList.length;
    const stages = stageCounts.reduce((sum, s) => sum + s.length, 0);
    const rules = (
      await adapter.automationRules.list(orgId, { isActive: true })
    ).length;

    return {
      clientCode,
      counts: { pipelines, stages, rules },
      isReady: pipelines > 0 && stages > 0,
      suggestion:
        pipelines === 0 ? "Deploy a CRM Blueprint to get started." : null,
    };
  },
};
