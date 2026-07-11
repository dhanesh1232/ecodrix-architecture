// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVED — NOT BUILT
// ─────────────────────────────────────────────────────────────────────────────
// Original path: src/platform/routes/admin/agency.routes.ts
// Original mount: /v1/api/platform/admin/agency/*
// Original guard: requirePlatformAdmin()
//
// See ../../DESIGN.md for how this comes back as `req.platform.agency.*`
// under `tenantResolver() + requireAgency()`. Do NOT drop this file back
// into src/ verbatim — the auth guard changes, the SDK calls should be
// bound to the caller's scope (not admin cross-tenant), and blueprint
// deploy needs to be routed through `AdminSDK.blueprints.deploy()`
// (currently unimplemented).
// ─────────────────────────────────────────────────────────────────────────────

import { HealthService } from "@platform/services/global/health.service";
import { OrchestratorService } from "@platform/services/global/orchestrator.service";
import { PortfolioService } from "@platform/services/global/portfolio.service";
import { UsageService } from "@platform/services/global/usage.service";
import { requirePlatformAdmin } from "@shared/middleware/requirePlatformAdmin";
import express, { type Request, type Response } from "express";

/**
 * @module Routes/Agency
 * @responsibility High-level orchestration for White-Label Agencies.
 *
 * **GOAL:** Provide an administrative suite for Agency owners to manage "Blueprints" (standardized tenant templates), monitor portfolio health, and oversee staff/usage.
 *
 * **DETAILED EXECUTION:**
 * 1. **Blueprint Factory**: Manage "Gold Standard" configurations that can be cloned to new tenants via `OrchestratorService`.
 * 2. **Portfolio Intelligence**: Aggregate KPIs across all sub-tenants belonging to an agency to detect churn or growth.
 * 3. **Usage & Wealth**: Real-time billing insight by aggregating storage and message counters per `clientCode`.
 */
const router = express.Router();

/**
 * Canonical target-tenant resolution for `:clientCode` routes.
 */
router.param("clientCode", async (req, _res, next, value) => {
  try {
    const { resolveOrgByClientCode } =
      await import("@shared/middleware/tenantResolver");
    const org = await resolveOrgByClientCode(String(value));
    if (org) {
      req.org = org;
      req.orgId = org.id;
    }
    next();
  } catch {
    next();
  }
});

// ── BLUEPRINTS ──────────────────────────────────────────────────────────────

router.get(
  "/blueprints",
  requirePlatformAdmin(),
  async (req: Request, res: Response) => {
    try {
      const blueprints = await req.platform.admin.blueprints.list();
      res.json({ success: true, data: blueprints });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.post(
  "/blueprints",
  requirePlatformAdmin(),
  async (req: Request, res: Response) => {
    try {
      const blueprint = await req.platform.admin.blueprints.create(req.body);
      res.status(201).json({ success: true, data: blueprint });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.post(
  "/blueprints/deploy",
  requirePlatformAdmin(),
  async (req: Request, res: Response) => {
    try {
      const { clientCode, blueprintId } = req.body;
      const result = await OrchestratorService.deployBlueprint(
        clientCode,
        blueprintId,
        "agency_admin",
      );
      res.json({ ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── PORTFOLIO INTELLIGENCE ──────────────────────────────────────────────────

router.get(
  "/portfolio/:agencyCode/stats",
  requirePlatformAdmin(),
  async (req: Request, res: Response) => {
    try {
      const stats = await PortfolioService.getAgencyStats(
        req.params.agencyCode as string,
      );
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.get(
  "/portfolio/:agencyCode/health",
  requirePlatformAdmin(),
  async (req: Request, res: Response) => {
    try {
      const report = await HealthService.checkPortfolioHealth(
        req.params.agencyCode as string,
      );
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── WEALTH (Usage & Billing) ────────────────────────────────────────────────

router.get(
  "/usage/:clientCode",
  requirePlatformAdmin(),
  async (req: Request, res: Response) => {
    try {
      const usage = await UsageService.getUsage(
        req.params.clientCode as string,
      );
      res.json({ success: true, data: usage });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

export default router;
