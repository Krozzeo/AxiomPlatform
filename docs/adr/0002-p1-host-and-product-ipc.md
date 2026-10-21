# ADR-P0002 — P1 host and product IPC

2026-10-21. P1 subsequently integrated after CI and owner acceptance. Original candidate evidence is in [the report](../reports/P1_REPORT.md).

Implement one vertical slice without extracting mixed Engine services. Platform has a loopback Node host and web Hub. Each session launches an explicitly registered official Node product adapter through native IPC; projects never supply executable commands. Engine's adapter opens its production daemon/editor on a separate authenticated loopback port.

Manifest/protocol 1, Platform API 0.1.0; compatibility admits 0.1 patches and excludes 0.2. Negotiate identity/version/capabilities/root before opening. Existing Engine schemaVersion 1 / axiom.game-project remains unchanged. SDK contracts/client belong here; the adapter stays in Engine. No npm-registry publication in P1.

Session states: starting/ready/closed/failed; ready only after server/document readiness. Save/close verify expected revision inside the product transaction. Host/product receipts bound duplicate operationId effects (256 operations); no durable deduplication promise after restart. Unknown outcomes require inspection.

Exact Host/Origin/Bearer and CSP protect HTTP. Editor bootstrap uses its own temporary fragment token; do not log/share it. Canonical roots/entrypoints reject escapes. Product leases are by folder; sequenced buffer reports ignore older clean reports. Platform save never discards pending code buffers. Explicit discard is required. Abrupt close can lose drafts/leave a lease; no automatic fake recovery.

Rejected iframe embedding, importing SceneWorkspace into Platform and wholesale AI/Hub extraction. IPC isolates control without extra control ports, but is not an OS sandbox. P1 intentionally had an in-memory catalog/manual paths until P2. Native startup remains; older binaries do not know the lease. Acceptance covers incompatible/no-write, process failure, cancel/save/stale/reopen/buffer guards and native restart; Null is UI evidence only.
