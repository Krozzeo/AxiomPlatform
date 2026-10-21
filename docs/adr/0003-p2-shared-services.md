# ADR-P0003 — P2 shared services and persistence

2026-10-21. Review candidate; remote CI and real native acceptance remain independent.

Platform owns persistent catalog/preferences, OS folder selection/Documents, atomic JSON, bounded copying and GitHub account/transport. Engine reexports these from a public HTTPS commit archive with lockfile integrity, no checkout links or moving-branch dependency. The package is private with respect to npm-registry publication, not a private GitHub archive.

The host profile contains registration/preferences/projects under a lock. Do not reset corrupt data or move project files when changing storage. CLI overrides are explicit; subsequent startups reuse configuration. startHost tests receive stateRoot or isolated defaults; CLI uses a user profile.

One host account retains its credential only in memory. Product IPC binds each request to a session. Editor-entered tokens transit to the host; account identity/epoch invalidates old requests/reviews. Closing one product does not disconnect others. Disconnect/revocation affects all; already dispatched remote effects need receipts/reconciliation rather than promised rollback.

Game destinations, explicit defaults, publication history/journal and bundle validation remain product/project-specific. Metadata is outside user documents; legacy native data is adopted only for matching identity. Hub endpoints expose connect/list, not arbitrary GitHub requests; import broker traffic is read-only. Product detects formats/resources; Platform grants source reads and bounded copy. Original files remain intact; no universal format is introduced.

Rejected per-daemon credential copies and duplicate transports. Direct Engine Hub uses the same installed transport, while Platform manages hosted sessions. Official installations are trusted code, not sandboxed plugins. P3, Unity and GPU are outside P2. [Evidence](../reports/P2_REPORT.md), [current guide](../P2_GUIDE.md).
