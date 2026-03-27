# Implementation Plan v2

This document captures the remaining work, priorities, deliverables, and an audit/checklist for WhatsApp automation features.

## High-level priorities (mapped to TODOs)
- Logging & Observability: `Pino`, `Sentry`, `New Relic`, `Doppler` (envs)
- CI/CD & Releases: `P8-5` (GitHub Actions, auto-versioning, release notes, TestFlight/PlayStore tracks)
- PlayStore/AppStore compliance: `P8-2` and `P8-3` (build validation, signing, metadata)
- WhatsApp automation: `P6-BE-1`, `P6-BE-2`, `P6-FE-1`, and feature implementations
- App builds & offline verification: Expo standalone builds and sync validation
 - App builds & offline verification: Expo standalone builds and sync validation

---

## WhatsApp Audit & Implementation Checklist (P6)
Goal: Provide reliable, billable WhatsApp automations for Pro customers only.

A. Backend (P6-BE-1)
- [ ] Add `whatsapp` service module (e.g., `src/modules/whatsapp`) exposing:
  - template validation and management
  - sendMessage(templateName, payload, to, options)
  - sendMessageQueueWorker (queue + retry + backoff)
- [ ] Store API credentials in env (move to Doppler) and validate at boot
- [ ] Persist message events: `whatsapp_messages` table with columns: id, workspace_id, template, to, payload, status (queued|sent|failed), attempts, sent_at, error
- [ ] Implement acknowledgement/webhook handler for delivery receipts if using Business API
- [ ] Rate-limit & quota enforcement hooks integrated with billing/subscription service
- [ ] Acceptance: system sends approved template messages reliably; stored events for audit

B. Messaging policies & quotas (P6-BE-2)
- [ ] Enforce per-workspace daily/monthly quotas based on subscription plan
- [ ] Emit billing events when messages cross thresholds (overage invoicing)
- [ ] Log each message lifecycle event for audit and reconciliation
- [ ] Acceptance: message consumption is trackable per workspace and plan; overages captured

C. Frontend (P6-FE-1)
- [ ] Settings UI enabling/disabling WhatsApp automations (opt-in per workspace)
- [ ] Per-event toggles: receipts, low-stock alerts, reminders, monthly summary, staff digest
- [ ] Delivery status indicators on message records where relevant
- [ ] Acceptance: users can enable/disable automations; UI shows delivery status

D. Feature list (priority & Pro-only)
- High priority (Pro-only):
  - WhatsApp payment receipts (send receipt after sale)
  - Debt reminder via WhatsApp (auto-send on due/overdue)
  - Low stock alert to owner via WhatsApp
  - Payment link flow (send pay link in reminders, track click-to-pay)
- Medium priority:
  - Month-end business summary via WhatsApp
  - Staff activity digest to branch managers
  - Collections workflow templates (one-tap follow-up)
- Long-term / advanced (Pro):
  - Smart debt score per customer (ML/rules)
  - Auto-reorder suggestions from sales velocity
  - Profit guardrails alerts
  - Staff fraud controls and branch health score

E. Acceptance criteria (WhatsApp)
- Templates validated and sent reliably by queue worker
- Message events logged for billing and audit
- Quotas enforced per-plan and overage flow works
- Settings UI toggles and delivery status visible

---

## P8: PlayStore & AppStore compliance and build pipeline

P8-2: PlayStore compliance prep
- Update app metadata (versionCode, description, screenshots, privacy policy URL)
- Add required permissions to `app.json` and document them
- Validate Gradle signing and proguard if used
- Test AAB generation with production profile
- Acceptance: artifacts pass PlayStore checks; versions increment correctly

P8-3: AppStore compliance prep
- Update `buildNumber` and `version` for iOS
- Configure Apple signing (certs/profiles) and document steps
- Add app preview screenshots and metadata
- Test IPA generation and TestFlight upload
- Acceptance: IPA builds and uploads to TestFlight; versioning clear

P8-5: Build artifact versioning & CI/CD
- Set up GitHub Actions workflows for main branch: lint/test/build/migrations/artifacts
- Auto-increment version codes for PlayStore/AppStore (scripted or GH Action)
- Generate release notes from changelog on release tags
- Create release tracks: internal/test/production
- Acceptance: reproducible builds; testers receive test artifacts automatically

---

## Infra & Observability
- Structured logging: introduce `pino` (or `winston`) with JSON output and central transport
- Error reporting: Sentry integration for uncaught exceptions and request traces
- Monitoring: New Relic (or alternative) APM for latency, error rates, throughput
- Secrets: migrate envs to Doppler and update deployment docs

---



## Implementation steps (short roadmap)
1. Audit WhatsApp and produce checklist (this doc lists items). Owner: Backend
2. Implement WhatsApp service + message table + queue worker. Owner: Backend
3. Implement quotas and billing hooks. Owner: Backend
4. Add FE settings + delivery indicators. Owner: Frontend
5. Add Pino + Sentry + New Relic. Owner: Backend
6. Migrate envs to Doppler and remove secrets from repo. Owner: Infra
7. Add CI/CD workflows (P8-5) with auto-version. Owner: DevOps
8. PlayStore/AppStore prep and test builds. Owner: Mobile
9. Final QA: offline sync verification, WhatsApp flows, billing/reconciliation

---

## Next concrete actions I can take now
- Produce a detailed WhatsApp implementation ticket list (I can expand each item to subtasks)
- Add CI workflow templates for GitHub Actions (lint/test/build/migrate/release)
- Scaffold `whatsapp` module skeleton in `backend/src/modules/whatsapp` with message entity and worker
- Add `pino` integration to `backend/src/main.ts` and a simple logger wrapper

Tell me which of the next concrete actions above you'd like me to start; I'll implement and produce PR-ready changes.