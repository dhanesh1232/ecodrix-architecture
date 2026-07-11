// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVED — NOT BUILT
// ─────────────────────────────────────────────────────────────────────────────
// Original path: src/platform/services/global/orchestrator.service.ts
//
// Blueprint-deploy engine — clones a saved `ecodrix_blueprints` row's
// pipelines + stages + automation rules into a target tenant. Useful in
// TWO scenarios:
//
//   1. Admin onboarding: ECODrIx admin clicks "clone gold-standard setup"
//      onto a newly-created direct-SMB tenant. Wrap this under
//      `AdminSDK.blueprints.deploy(toClientCode, blueprintId)` when needed.
//
//   2. Tenant-as-agency: an agency deploys their saved blueprint onto a
//      new sub-tenant. Wrap under `AgencySDK.blueprints.deploy(toClientCode, id)`
//      when the agency mode ships.
//
// Both re-use this same core logic. Move to
// `src/platform/services/blueprints/deploy.service.ts` (or similar) when
// the first consumer needs it — that's the tighter home than `global/*`.
//
// One dependency to note: this file currently imports `AuditService` from
// `./audit.service` (relative). The AuditService is STILL LIVE at
// `src/platform/services/global/audit.service.ts` — it's used by the
// withSDK middleware for cross-cutting mutation audit trails. Keep that
// import when re-hydrated.
// ─────────────────────────────────────────────────────────────────────────────

import { getErixAdapter } from "@erix/lib/erix-adapter";
import { getBlueprint } from "@platform/services/admin/blueprints.service";
import { getOrgIdFromClientCode } from "@shared/lib/org-lookup";
import { AuditService } from "@platform/services/global/audit.service";

export const OrchestratorService = {
  deployBlueprint: async (
    clientCode: string,
    blueprintId: string,
    performedBy: string,
  ) => {
    const blueprint = await getBlueprint(blueprintId);
    if (!blueprint) throw new Error("Blueprint not found");

    const orgId = await getOrgIdFromClientCode(clientCode.toUpperCase());
    if (!orgId)
      throw new Error(`deployBlueprint: org not found for ${clientCode}`);
    const adapter = await getErixAdapter(orgId);

    const auditMeta: Record<string, any> = {
      blueprintId,
      blueprintName: blueprint.name,
      deployedComponents: [] as string[],
    };

    // 1. Deploy Pipelines & Stages
    const pipelines = (blueprint.content.pipelines ?? []) as any[];
    if (pipelines.length) {
      for (const pConfig of pipelines) {
        const pipeline = await adapter.pipelines.create(orgId, {
          name: pConfig.name,
          description: pConfig.description,
          isDefault: pConfig.isDefault || false,
        });

        const stages = (pConfig.stages ?? []) as any[];
        if (stages.length) {
          for (const sConfig of stages) {
            await adapter.pipelines.createStage(orgId, pipeline.id, {
              name: sConfig.name,
              color: sConfig.color,
              order: sConfig.order,
              probability: sConfig.probability,
              isWon: sConfig.isWon || false,
              isLost: sConfig.isLost || false,
            });
          }
        }
        auditMeta.deployedComponents.push(`pipeline:${pipeline.name}`);
      }
    }

    // 2. Deploy Automation Rules
    const automationRules = (blueprint.content.automationRules ?? []) as any[];
    if (automationRules.length) {
      for (const rConfig of automationRules) {
        await adapter.automationRules.create(orgId, {
          name: rConfig.name,
          trigger: rConfig.trigger,
          triggerConfig: rConfig.triggerConfig ?? {},
          condition: rConfig.condition ?? null,
          actions: rConfig.actions ?? [],
          steps: rConfig.steps,
          isActive: true,
        });
        auditMeta.deployedComponents.push(`automation:${rConfig.name}`);
      }
    }

    // 3. Log the deployment via the still-live AuditService
    await AuditService.log({
      clientCode,
      action: "agency.blueprint.deploy",
      resourceType: "Blueprint",
      resourceId: blueprintId,
      performedBy,
      severity: "info",
      metadata: auditMeta,
    });

    // NOTE: original also called `UsageService.consume(clientCode, "automation_run", 1)`
    // via the legacy Mongo-era shim. When re-hydrated, replace that with
    // the modern typed pair — e.g., `req.platform.billing.usage.record("workflows", "runsPerMonth", 1)`.

    return {
      success: true,
      message: `Blueprint "${blueprint.name}" deployed to ${clientCode}`,
      components: auditMeta.deployedComponents,
    };
  },
};
