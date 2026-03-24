# Booker Implementation Plan

Last Updated: 2026-03-17

## Goal
Ship monetizable core features in a safe sequence:
1. Subscription foundation (Basic vs Pro) and branch/workspace limits
2. Customer and debt workflow improvements
3. Email and auth hardening (verification + reset OTP)
4. Team invite and role management
5. Reporting export (CSV) + receipt storage
6. WhatsApp Meta API automation
7. Monitoring and logging for production

## Delivery Principles
- Build backend contract first, then frontend integration
- Keep each phase deployable independently
- Add minimal tests for each backend feature before moving on
- Use feature flags/config where rollout risk exists
- Prefer async/background processing for external integrations (email, WhatsApp)
- Keep secrets in environment variables only (no hardcoded credentials)

## Cross-Cutting Foundation: Infra + Async Processing

### INFRA-1: SMTP + background job pipeline (Completed)
- Integrate SMTP provider (via Nest mailer service + transport config)
- Add background jobs (queue + worker) for non-blocking email send
- Add retry policy, dead-letter handling, and idempotency key support
- Acceptance:
  - API response is fast while email sends in background
  - Failed sends are retried and observable in logs

### INFRA-2: Object storage (DigitalOcean Spaces)
- Integrate S3-compatible client for DigitalOcean Spaces
- Add file service for uploads, signed URLs, and lifecycle policy hooks
- Target artifacts:
  - Reports CSV exports
  - Receipt files/images (where available)
- Acceptance:
  - Files are stored in Spaces and retrievable by signed/public URL policy
  - App stores metadata only (path/url, content type, size)

### INFRA-3: Observability baseline (monitoring + logging)
- Structured logging across API and workers (request ID, user ID, workspace ID)
- Health/readiness endpoints and key metrics (queue lag, email success rate)
- Error tracking hooks for backend runtime exceptions
- Acceptance:
  - Production incidents can be traced with correlation IDs
  - Queue/email/storage failures are visible with actionable logs

## Phase 1: Subscription + Workspace Limits (In Progress)

### P1-COM-1: Commercial definition (Pro plan + add-ons)
- Basic plan includes:
  - 1 workspace (single branch)
  - Unlimited products and transactions
  - Inventory management
  - Debt tracking
  - Expense tracking
  - Basic reports
  - CSV/Excel export
  - Receipt generation
  - Customer profiles
  - Low stock push notifications
- Pro plan includes:
  - Everything in Basic
  - Up to 3 workspaces (multi-branch)
  - Up to 5 staff accounts
  - Advanced reports + trends
  - WhatsApp debt reminders (automated)
  - WhatsApp payment receipts
  - WhatsApp low stock alerts to owner
  - WhatsApp monthly business summary
  - Included WhatsApp quota: 100 messages/month
  - Priority support
- Pro add-ons:
  - Extra branch/workspace slot: `₦1,500/month` each
  - Extra staff seat: `₦500/month` each
  - Extra WhatsApp messages bundle: `100 messages = ₦2,000` (~`₦20-25` per message)
- Billing cycles:
  - Monthly billing (default)
  - Yearly billing at `20% discount` compared to 12 months
- Fair-use policy:
  - When included WhatsApp quota is exhausted, automation pauses
  - Automation resumes only when a WhatsApp message add-on is active
- Trial policy:
  - 14-day free trial grants Pro base features only
  - No add-ons can be purchased or applied while trial is active
- Acceptance:
  - Limits and quotas are deterministic and enforceable in backend
  - UI displays included limits and add-on costs clearly before checkout
  - Quota exhaustion state is visible and actionable

### P1-BE-0: 14-day free trial policy (Required)
- Add trial fields on user/subscription domain:
  - `trialStartAt`
  - `trialEndsAt`
  - `trialStatus` (`active` | `expired` | `converted`)
- Default new accounts to `pro` plan with `trialStatus=active` for 14 days
- Enforce feature access by plan + trial state:
  - During trial: Pro-gated features allowed
  - During trial: add-ons are disabled (Pro base only)
  - After trial expiry without upgrade: block access and require paid upgrade
- Add endpoint metadata so frontend can show trial countdown (`daysLeft`)
- Acceptance:
  - New users get exactly 14 days free trial on Pro
  - Expired trial users are blocked until they upgrade to a paid plan
  - Existing users are backfilled safely without auth regressions

### P1-BE-1: Add plan field + workspace role migration (In Progress)
- Add `plan` to user domain (`basic` default, `pro` optional)
- Ensure workspace membership role model supports `owner`, `manager`, `staff`
- Add DB migration and backfill existing users to `basic`
- Acceptance:
  - Existing users still log in
  - New users get `basic`
  - Roles persist and are queryable

### P1-BE-2: Enforce workspace/branch limits per plan
- Add centralized plan guard/service in backend
- Rules:
  - `basic`: 1 workspace only
  - `pro`: up to 3 workspaces (or configured limit)
- Enforce on workspace create endpoints
- Return clear 403/422 error payload for UI handling
- Acceptance:
  - Basic user blocked from creating second workspace
  - Pro user can create up to limit, then blocked

### P1-FE-1: Plan badge + Upgrade modal
- Show current plan in Settings/Workspace context
- Add reusable `UpgradeModal` with clear Pro benefits
- Connect modal to upsell trigger points
- Acceptance:
  - Plan always visible
  - Upgrade modal can be launched from blocked actions

### P1-FE-2: Gate branch/workspace create behind plan
- In branch/workspace creation screens, call backend and handle plan-limit errors
- If blocked, show upgrade modal with contextual message
- Acceptance:
  - User sees meaningful reason and next step
  - No silent failures

### P1-FE-3: Subscription selection screen (Paywall)
- Add dedicated subscription screen where user selects a paid plan after trial
- Plans shown with pricing, limits, and feature comparison
- Screen entry points:
  - Trial expired login block
  - Upgrade CTA from `UpgradeModal`
  - Settings billing section
- Acceptance:
  - User can always reach a full plan selection page (not only a modal)
  - Selected plan starts checkout flow

### P1-BE-3: Subscription and billing backend logic
- Add subscription domain model (status, plan, period, trial linkage, renewal dates)
- Add endpoints for:
  - current subscription status
  - available plans
  - initiate upgrade
  - verify/activate subscription
- Encode included Pro quotas and add-on multipliers in billing logic:
  - workspaceLimit = 3 + addonWorkspaceSlots
  - staffSeatLimit = 5 + addonStaffSeats
  - whatsappMonthlyQuota = 100 + addonWhatsappBundles * 100
- Encode Basic plan entitlements in billing logic:
  - workspaceLimit = 1
  - products/transactions = unlimited
  - features = inventory, debt, expense, basic reports, csv/export, receipt, customer profiles, low-stock push alerts
- Trial guard:
  - when `trialStatus=active`, force add-on quantities to zero
- Enforce access by subscription status (active, trialing, expired, cancelled)
- Acceptance:
  - Trial-expired users are blocked until paid plan is active
  - Subscription state is source of truth for access checks

### P1-BE-4: Paystack payment integration
- Integrate Paystack transaction initialize/verify APIs
- Save payment reference and map to internal subscription record
- Add Paystack webhook endpoint with signature verification and idempotency handling
- Handle events: charge.success, charge.failed, subscription events where applicable
- Handle purchase targets:
  - plan upgrade purchase
  - add-on purchase (workspace slot, staff seat, WhatsApp bundle)
- Acceptance:
  - Successful Paystack payments activate selected plan
  - Failed payments do not activate plan
  - Webhook retries do not create duplicate upgrades

### P1-FE-4: Plan details + add-ons in subscription UI
- Show included Pro features and limits in plan selection screen
- Add add-on selector UI for:
  - extra workspace slots
  - extra staff seats
  - WhatsApp bundles
- Show live pricing calculator before checkout
- Show quota/seat/slot usage indicators in settings and billing screens
- Acceptance:
  - User understands exactly what is included vs paid as add-on
  - User can buy plan + add-ons in a single checkout flow
  - User can buy additional add-ons later from billing settings

## Phase 2: Customer + Debt Improvements

### P2-BE-1: Customer entity + CRUD
- Create `Customer` entity tied to workspace/branch
- Fields: name, phone, email(optional), note(optional), status
- Endpoints: create/list/update/delete with workspace scoping
- Acceptance:
  - Customer records isolated by workspace
  - Validation and pagination in list endpoint

### P2-FE-1: Customer management screens
- Add `CustomersListScreen` and `AddCustomerScreen`
- Search by name/phone
- Acceptance:
  - User can add and view customers from app UI

### P2-FE-2: Debt flow integration
- In `RecordDebtScreen`, add customer picker
- Save debt against customer ID
- Add per-customer debt summary in debt views
- Acceptance:
  - Debts are linked and traceable to customer records

## Phase 3: Auth Security (Email Verification + Password Reset OTP)

### P3-BE-1: Registration email verification (6-digit OTP) (Completed)
- On registration, generate 6-digit verification code and expiry
- Queue email send via background job (SMTP)
- Add verify endpoint to activate account/email status
- Add resend endpoint with cooldown/rate limits
- Acceptance:
  - User cannot use protected flows until email is verified (policy-controlled)
  - Verification code is single-use and expires correctly

### P3-BE-2: Forgot password via 6-digit code (Completed)
- Generate 6-digit reset code + expiry for forgot password
- Send reset code by background email job
- Add endpoints: request reset, verify code, set new password
- Rate limit reset attempts and protect against enumeration
- Acceptance:
  - Valid code allows password reset
  - Expired/invalid code is rejected with clear error

### P3-FE-1: Verification and reset screens update (Completed)
- Add OTP input flow for registration verification
- Update forgot password screen to handle 6-digit code verification + new password
- Add resend timer UI and friendly error states
- Acceptance:
  - User can complete verification and reset flows fully on mobile

## Phase 4: Team Invite + Member Management

### P4-BE-1: Invite member endpoint
- Endpoint to invite by email/phone with target role and branch/workspace scope
- For existing user: create pending membership
- For new user: create invitation token flow
- If invite uses email, send invite via SMTP queue worker
- Acceptance:
  - Invite cannot exceed role permissions of inviter
  - Invite audit fields saved

### P4-FE-1: Team members + invite screen
- Add Team screen showing members and roles
- Add Invite form with role selector
- Acceptance:
  - Owner can invite Manager/Staff
  - Manager can invite Staff only (if policy enabled)

## Phase 5: Reports Export + Receipt Storage

### P5-BE-1: CSV generation and upload pipeline
- Generate report CSV on backend (filter/date scoped)
- Upload CSV file to DigitalOcean Spaces
- Return file metadata + signed download URL
- Acceptance:
  - Export link works and expires per policy
  - File generation handles large datasets safely

### P5-BE-2: Receipt storage in Spaces
- Store receipt files/images in Spaces during sale/expense flows where applicable
- Save receipt metadata references on transaction entities
- Acceptance:
  - Receipts can be uploaded and later retrieved securely

### P5-FE-1: Export and receipt UX
- Update Reports screen to request backend export and open/share returned file URL
- Add receipt upload/view controls in transaction recording screens
- Acceptance:
  - CSV export and receipt access work on Android and iOS

## Phase 6: WhatsApp Meta API Integration

### P6-BE-1: Meta WhatsApp API service integration
- Add WhatsApp service module (templates + utility sends)
- Store API credentials in env and validate on boot
- Use queue worker for outgoing messages and retries
- Acceptance:
  - System can send approved template messages reliably

### P6-BE-2: Messaging policies and quotas
- Enforce subscription quotas and overage rules in backend
- Log each message event (queued/sent/failed) for billing/audit
- Acceptance:
  - Message consumption is trackable per workspace and plan

### P6-FE-1: WhatsApp automation settings
- Add settings UI for opt-in toggles and event selection
- Add delivery status indicators where needed
- Acceptance:
  - Users can enable/disable WhatsApp automations clearly

## Phase 7: Monitoring + Logging Hardening

### P7-BE-1: Structured logs and correlation IDs
- Add request/queue correlation IDs through middleware and jobs
- Standardize log format with severity and context fields
- Acceptance:
  - Single operation traceable across API + worker

### P7-BE-2: Dashboards and alerts
  - Team gets proactive alerts for production issues

## Phase 8: Build + Deployment (PlayStore/AppStore Ready)

### P8-1: Expo SDK upgrade to latest
- Update from SDK 49 to latest stable version (SDK 51+)
- Test all core functionality: auth, sync, UI, offline features on real devices
- Update native dependencies (React Native, Android/iOS tools)
- Validate EAS build pipeline works for both Android and iOS
- Acceptance:
  - App builds and runs without crashes on latest SDKs
  - No auth/sync regressions
  - eas build commands succeed for both playstore and appstore profiles

### P8-2: PlayStore compliance prep
- Update app metadata: version code, description, screenshots, privacy policy link
- Add required permissions documentation in app.json
- Validate gradle/signing config for production PlayStore build
- Test APK/AAB generation with production profile
- Acceptance:
  - Build artifacts pass PlayStore validation checks
  - Version increments properly for updates

### P8-3: AppStore compliance prep
- Update iOS build number and version codes
- Configure Apple signing certificates and provisioning profiles
- Add app preview screenshots and metadata
- Test production IPA generation
- Acceptance:
  - IPA builds and can be uploaded to TestFlight
  - Version management is clear for incremental updates

### P8-4: UI/UX improvements and refinements
- Improve dashboard card layouts and spacing on different screen sizes
- Enhance form validation feedback and error messaging
- Add loading state indicators and skeleton screens for data-heavy views
- Refine color contrast and accessibility (WCAG AA compliance)
- Reorganize navigation tab order and screen hierarchy for discoverability
- Add micro-interactions (touch feedback, animations) for key actions
- Improve empty state messaging and call-to-action clarity
- Acceptance:
  - App feels polished and responsive across phones/tablets
  - Users get clear feedback at every interaction point
  - Navigation is intuitive and discoverable

### P8-5: Build artifact versioning and CI/CD pipeline
- Set up automated build triggers on main branch commits
- Auto-increment version codes for PlayStore/AppStore
- Generate release notes from changelog
- Set up TestFlight and PlayStore testing tracks
- Acceptance:
  - Builds are reproducible and version-managed
  - Testers get automatic updates to test versions

## Execution Order (Next 20 Work Items)
1. Implement P1-BE-0 14-day free trial policy
2. Finish P1-BE-1 migration and entity updates
3. Implement P1-BE-2 plan limit guard/service
4. Wire plan-limit guard into workspace create endpoint
5. Add frontend plan badge in settings/workspace area
6. Implement reusable `UpgradeModal`
7. Handle plan-limit backend errors in branch/workspace create UI
8. **PARALLEL START**: Expo SDK upgrade to latest (P8-1)
9. Set up SMTP config + async email queue worker (INFRA-1)
10. Implement registration email verification with 6-digit OTP (P3-BE-1)
11. Implement forgot-password 6-digit OTP reset flow (P3-BE-2)
12. Implement `Customer` backend entity + list/create endpoints
13. Add customer list/create mobile screens
14. Integrate customer picker into debt recording
15. Integrate DigitalOcean Spaces for CSV + receipt storage (INFRA-2, P5)
16. Add WhatsApp Meta API service with queue and quotas (P6)
17. PlayStore metadata + compliance checks (P8-2)
18. AppStore metadata + compliance checks (P8-3)
19. UI/UX refinements and polish (P8-4)
20. CI/CD pipeline setup for automated builds (P8-5)

## API/Error Contract for Plan Limits
Use a consistent payload for blocked actions:

```json
{
  "statusCode": 403,
  "code": "PLAN_LIMIT_REACHED",
  "message": "Your Basic plan allows only 1 workspace. Upgrade to Pro to add more.",
  "meta": {
    "plan": "basic",
    "limit": 1,
    "current": 1,
    "feature": "workspace.create"
  }
}
```

## Definition Of Done (Per Task)
- Code implemented and lint-clean
- Backend endpoint validated manually
- UI path tested on at least one real device/emulator
- No auth/workspace isolation regressions
- Small changelog entry in PR description
- Logs/metrics added for new async/external integration features

## Immediate Start (Current Sprint)
- Active now: `P1-BE-0 14-day free trial policy`
- Next after completion: `P1-BE-1 Add plan field + workspace role migration`
- Then: `P1-BE-2 Enforce workspace limit per plan`
- Completed in parallel: `P8-1 Expo SDK upgrade`

## Environment Variables Checklist
- `CORS_ORIGIN`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `PAYSTACK_CALLBACK_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `QUEUE_REDIS_URL` (or equivalent queue backend)
- `DO_SPACES_ENDPOINT`
- `DO_SPACES_REGION`
- `DO_SPACES_BUCKET`
- `DO_SPACES_ACCESS_KEY`
- `DO_SPACES_SECRET_KEY`
- `DO_SPACES_CDN_BASE_URL` (optional)
- `WHATSAPP_META_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`




Now (core business logic — no external deps)

#3–6: Subscription plan enforcement + frontend gates — this is the monetization foundation everything else builds on
Then (email infra first, then auth features that need it)

#7: SMTP + async queue — must exist before any OTP emails can be sent
#8–10: Registration OTP + forgot password OTP
Then (customer + debt — self-contained features)

#11–13: Customer entity → screens → debt picker
Then (invites — needs SMTP already set up)

#14–15: Team invite endpoint + screens
Then (file storage, then features that depend on it)

#16: DO Spaces service — must exist before any file uploads
#17: CSV export + receipt storage
Then (WhatsApp — its own integration, comes after core flows are stable)

#18: WhatsApp Meta API
Finally (polish + store prep — done last so there's a complete app to polish/submit)

#19: UI/UX polish
#20: Monitoring + logging
#21–22: PlayStore + AppStore compliance
#23: CI/CD automation
Also — the build ran with exit code 1. Do you want me to check what the build error was before we continue?

Claude Sonnet 4.6 • 0.9x

## Phase 9: Offline-First Excellence (Workspace-Isolated + Android Biometric Unlock)

### P9-ARC-1: Core offline architecture principles
- Local-first reads: app UI reads from local database first, then sync updates from server
- Eventual sync writes: all create/update/delete operations are queued and replayed when online
- Workspace isolation by design: each record must be bound to one workspace key and never leak across workspaces
- Sync transparency: pending/failed/synced status visible at row level (not only global)
- Safe conflict handling: predictable merge policy and retry strategy

### P9-DATA-1: Workspace-isolated local schema
- Add local tables with mandatory workspace ownership fields:
  - `local_workspaces`
  - `local_inventory`
  - `local_transactions`
  - `local_debts`
  - `sync_outbox`
  - `id_mapping` (local ID -> server ID)
- Required columns for local entities:
  - `local_id`
  - `server_id` (nullable)
  - `workspace_local_id`
  - `workspace_server_id` (nullable)
  - `sync_status` (`pending_create` | `pending_update` | `pending_delete` | `synced` | `failed`)
  - `last_error` (nullable)
  - `updated_at_local`
- Acceptance:
  - Data from workspace A never appears in workspace B local queries
  - Each list query is filtered by the active workspace identifier

### P9-DATA-2: Local workspace catalog and switching behavior
- Persist all known workspaces in `local_workspaces`
- Include both synced and offline-created workspaces
- Workspace switcher behavior:
  - Show synced workspaces
  - Show pending offline-created workspaces with "Not synced" label
  - Show failed workspaces with retry affordance
- Acceptance:
  - User can switch among locally available workspaces while offline
  - Unknown/non-downloaded workspaces are not shown as available offline data sources

### P9-DATA-3: Offline workspace creation with dependency-safe sync
- When offline workspace create is attempted:
  - Create local workspace row immediately (`sync_status=pending_create`)
  - Set active workspace to local workspace ID
  - Queue `create_workspace` action in outbox
- Child operations (inventory/sales/debt) created under this workspace must reference local workspace ID and include dependency metadata
- On reconnect:
  - Sync workspace create first
  - Save local->server workspace ID mapping in `id_mapping`
  - Rewrite dependent queued actions to resolved server workspace ID
  - Continue replay of dependent actions
- Acceptance:
  - User can create workspace offline and continue work immediately
  - All dependent actions replay correctly after reconnect

### P9-SYNC-1: Outbox model upgrade (structured actions)
- Replace URL-only queued actions with structured payload:
  - `action_id`
  - `action_type`
  - `entity_type`
  - `entity_local_id`
  - `workspace_ref` (local/server)
  - `payload`
  - `depends_on_action_id` (nullable)
  - `retry_count`
  - `next_retry_at`
  - `last_error`
- Add deterministic processing order and exponential backoff retries
- Acceptance:
  - Queue can handle parent-child dependencies and partial failures safely
  - Failed actions do not block unrelated workspace sync actions

### P9-SYNC-2: Read model = local base + pending overlay
- Lists should be rendered from local tables by default
- Overlay pending changes so users instantly see offline-created/edited/deleted items
- Add per-record sync badges:
  - Not synced
  - Syncing
  - Failed (tap to retry)
- Acceptance:
  - Offline actions are immediately visible in inventory/sales/debt lists
  - Users can distinguish local pending data from synced data

### P9-SYNC-3: Sync conflict policy
- Initial policy:
  - Last-write-wins based on `updated_at` for non-critical fields
  - Server authoritative for immutable IDs and access rules
- Domain-specific safeguards:
  - Inventory quantity conflict prompts on high-risk mismatch
  - Preserve local notes/comments where possible
- Acceptance:
  - Conflicts resolve predictably and are user-recoverable

### P9-AUTH-1: Offline authentication capability model
- Constraint:
  - First-time login requires internet
  - Returning authenticated user can unlock app offline
- Keep encrypted session token/user profile on device
- Add offline unlock mode when network unavailable and cached session exists
- Acceptance:
  - Offline login is supported for returning users only
  - Fresh account login while fully offline is blocked with clear message

### P9-AUTH-2: Android-only biometric unlock (fingerprint)
- Integrate Android biometric unlock via Expo Local Authentication
- Flow:
  - User opts in after successful online login
  - Device biometric capability and enrollment are checked
  - On app resume/offline mode, unlock with fingerprint
  - Fallback to passcode/PIN if biometric unavailable
- Policy:
  - Android only for now
  - iOS postponed
- Acceptance:
  - Returning Android users can unlock offline with fingerprint
  - Failed biometric attempts fall back gracefully to secure alternative

### P9-UX-1: Offline user experience standards
- Always show connectivity state (online/offline) in subtle status area
- Row-level sync status indicators in list items
- Local operation toasts:
  - Added locally, pending sync
  - Synced successfully
  - Sync failed, retry available
- Workspace-aware messaging:
  - "You are viewing offline data for [workspace name]"
- Acceptance:
  - No silent offline behavior
  - Users understand what is pending vs synced

### P9-SEC-1: Security and privacy for local data
- Encrypt sensitive local session/auth metadata
- Avoid storing unnecessary sensitive PII in plaintext
- Add local data clear options:
  - Sign out clears auth + queue
  - Optional "Clear offline cache" action
- Acceptance:
  - Offline mode does not weaken baseline security posture

### P9-QA-1: Test matrix for offline reliability
- Required manual and automated scenarios:
  - Online login -> go offline -> create records -> relaunch -> data persists
  - Offline workspace create -> add transactions -> reconnect -> sync order correct
  - Switch workspace offline -> verify strict data separation
  - Biometric unlock success/fail/lockout paths on Android
  - Token expired while offline -> allow local access, defer server calls
- Acceptance:
  - No cross-workspace leakage in offline mode
  - No data loss across app restarts and reconnect cycles

## Phase 9 Execution Order (Top Priority Offline Work)
1. Implement local workspace catalog and workspace-scoped local schema
2. Implement structured outbox with dependency support
3. Implement offline workspace creation + ID mapping replay
4. Migrate list screens to local-first reads + pending overlay
5. Add row-level sync badges and retry actions
6. Add Android biometric offline unlock flow
7. Add conflict resolution rules and error recovery UI
8. Run offline QA matrix and stabilize

## New Environment/Config Additions for Offline Phase
- `OFFLINE_MODE_ENABLED=true`
- `OFFLINE_SYNC_MAX_RETRIES=5`
- `OFFLINE_SYNC_BACKOFF_BASE_MS=1500`
- `ANDROID_BIOMETRIC_UNLOCK_ENABLED=true`

## Definition Of Done for Offline-First Phase
- Workspace data isolation guaranteed in local queries and UI
- Offline-created workspaces and child records sync successfully after reconnect
- Pending local records always visible in their workspace with status labels
- Returning Android users can unlock offline with fingerprint
- No silent sync failures (all failures visible and retryable)

## Phase 9 Ticket Backlog (Execution-Ready)

### Sprint 1: Foundation (Schema + Outbox + Workspace Isolation)

#### P9-BE-1: Local SQLite schema migration for offline-first entities
- Scope:
  - Add/upgrade local tables: `local_workspaces`, `local_inventory`, `local_transactions`, `local_debts`, `sync_outbox`, `id_mapping`
  - Add indexes for `(workspace_local_id, updated_at_local)` and `(sync_status, next_retry_at)`
- Dependencies: none
- Acceptance:
  - App boots with migrated schema on existing installs
  - Workspace-scoped local queries are fast and deterministic

#### P9-BE-2: Structured outbox service with dependency graph support
- Scope:
  - Replace URL-only queue shape with structured outbox record
  - Add `depends_on_action_id` handling and ordered replay
  - Add exponential retry/backoff fields and failure tracking
- Dependencies: `P9-BE-1`
- Acceptance:
  - Parent-child actions replay in valid order
  - Failed actions are retained with actionable `last_error`

#### P9-BE-3: Workspace identity mapping service (local_id <-> server_id)
- Scope:
  - Create mapper API in local sync layer
  - Resolve local workspace references before replaying child actions
  - Persist mapping in `id_mapping` table
- Dependencies: `P9-BE-1`, `P9-BE-2`
- Acceptance:
  - Offline-created workspace can receive server ID and unlock child action replay

#### P9-FE-1: Workspace-scoped repository abstraction
- Scope:
  - Introduce repository helpers that always require workspace reference
  - Block cross-workspace reads/writes at helper level
- Dependencies: `P9-BE-1`
- Acceptance:
  - No screen can accidentally query data outside active workspace

### Sprint 2: User-visible Offline Correctness (Immediate Local Visibility)

#### P9-FE-2: Offline workspace creation and switching UX
- Scope:
  - Allow creating workspace offline with local immediate creation
  - Show workspace statuses (`Synced`, `Not synced`, `Failed`)
  - Keep active workspace on local ID until mapped
- Dependencies: `P9-BE-2`, `P9-BE-3`, `P9-FE-1`
- Acceptance:
  - User can create/switch workspaces offline without data leakage

#### P9-FE-3: Local-first list rendering with pending overlay
- Scope:
  - Migrate Inventory/Sales/Debt screens to local-first reads
  - Overlay pending actions to reflect unsynced creates/updates/deletes immediately
- Dependencies: `P9-FE-1`, `P9-BE-2`
- Acceptance:
  - Offline-created records appear instantly on relevant screens

#### P9-FE-4: Row-level sync state badges and retry actions
- Scope:
  - Add per-row badges: `Not synced`, `Syncing`, `Failed`
  - Add tap-to-retry for failed rows/actions
- Dependencies: `P9-FE-3`
- Acceptance:
  - Users can identify and recover failed sync records without leaving screen

#### P9-BE-4: Sync coordinator worker in app context
- Scope:
  - Centralize reconnect triggers and replay cycles
  - Guard against concurrent replay race conditions
- Dependencies: `P9-BE-2`, `P9-BE-3`
- Acceptance:
  - One stable sync loop runs per device session

### Sprint 3: Secure Offline Access (Android Fingerprint)

#### P9-FE-5: Android biometric offline unlock (Expo LocalAuthentication)
- Scope:
  - Add biometric capability checks for Android only
  - Add opt-in toggle after successful online auth
  - Add unlock flow for offline returning users
- Dependencies: `P9-FE-3`
- Acceptance:
  - Returning Android user can unlock app offline using fingerprint

#### P9-FE-6: Offline auth fallback and guard policies
- Scope:
  - If biometric fails/unavailable, fallback to secure local unlock (PIN/passcode path)
  - Keep first-time login online-only
  - Allow local access with expired token while offline (defer server calls)
- Dependencies: `P9-FE-5`
- Acceptance:
  - Offline unlock path is resilient and predictable for Android users

### Sprint 4: Hardening (Conflict + QA + Observability)

#### P9-BE-5: Conflict resolution policy implementation
- Scope:
  - Implement default last-write-wins where safe
  - Implement inventory quantity conflict detect-and-prompt hooks
- Dependencies: `P9-BE-4`, `P9-FE-3`
- Acceptance:
  - Conflicts are surfaced with deterministic outcome rules

#### P9-QA-2: Offline reliability test suite
- Scope:
  - Automated + manual matrix for:
    - offline workspace create + child actions
    - cross-workspace isolation
    - app restart recovery
    - biometric unlock scenarios
- Dependencies: all P9 implementation tasks
- Acceptance:
  - Test matrix passes with no critical data-loss or cross-workspace defects

## Phase 9 Task Sequence to Append to Active Todo List
1. `P9-BE-1` Local SQLite schema migration for offline-first entities
2. `P9-BE-2` Structured outbox with dependency support
3. `P9-BE-3` Workspace ID mapping service
4. `P9-FE-1` Workspace-scoped repository abstraction
5. `P9-FE-2` Offline workspace create/switch UX
6. `P9-FE-3` Local-first list rendering + pending overlay
7. `P9-FE-4` Row-level sync badges + retry actions
8. `P9-BE-4` Central sync coordinator worker
9. `P9-FE-5` Android biometric offline unlock
10. `P9-FE-6` Offline auth fallback guard policies
11. `P9-BE-5` Conflict resolution policy
12. `P9-QA-2` Offline reliability test suite