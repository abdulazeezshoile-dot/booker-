# P9-QA-2 Offline Reliability Test Plan

## Purpose
Ensure all offline-first, sync, and conflict resolution features work reliably under real-world conditions, including network loss, device restarts, and concurrent edits.

## Test Matrix
| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| 1. Offline Create | Go offline → Create inventory/transaction → Reboot app → Go online | Data appears in UI, syncs to server, row marked as synced |
| 2. Offline Edit | Go offline → Edit existing row → Go online | Row updates on server, marked as synced |
| 3. Offline Delete | Go offline → Delete row → Go online | Row deleted on server, removed from UI |
| 4. Outbox Retry | Go offline → Create/edit → Go online with flaky network | Sync retries, eventually succeeds, no duplicate rows |
| 5. Workspace Switch | Go offline → Switch workspace → Create/edit in new workspace → Go online | Data syncs to correct workspace |
| 6. Dependency Sync | Go offline → Create workspace → Add inventory → Go online | Workspace and inventory both sync, IDs mapped |
| 7. Conflict Detection | Go offline → Edit row → On another device, edit same row → Go online | Row marked as conflict, not overwritten, user prompted |
| 8. Biometric Unlock | Go offline → Lock app → Unlock with fingerprint | App unlocks, no online check |
| 9. Offline Auth Fallback | Go offline > Lock app > Unlock with password | App unlocks if within offline window |
| 10. Expired Offline Auth | Go offline > Wait 8+ days > Try unlock | Unlock fails, prompts for online login |
| 11. App Crash Recovery | Go offline > Create/edit > Force close app > Reopen > Go online | No data loss, sync resumes |
| 12. Outbox Corruption | Manually corrupt outbox (dev) > Go online | App skips bad actions, logs error, continues syncing |

## Manual Test Steps
1. Toggle airplane mode or disable WiFi to simulate offline.
2. Perform actions as described above.
3. Re-enable network and observe sync.
4. Check UI for sync badges, conflict status, and error messages.
5. Repeat for each workspace and entity type.

## Automated Test Suggestions
- Simulate network loss and recovery in E2E tests.
- Mock API to return conflicting data for conflict scenarios.
- Assert outbox and local DB state after each test.

## Pass Criteria
- No data loss or corruption in any scenario.
- All sync, retry, and conflict flows work as described.
- User is always informed of sync status and conflicts.
- No crashes or unhandled errors.

---

Document test results and issues found below.
