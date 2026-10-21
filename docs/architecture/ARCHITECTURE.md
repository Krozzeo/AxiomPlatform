# Architecture

Platform supplies a local browser Hub and local host. Each official product adapter runs in a separate process and exposes its own authenticated loopback editor. Public SDK contracts connect lifecycle and shared services without importing product domain models.

The host owns registration, session identity/ownership, local credentials, persistence and allowed roots. SDK packages contain message validation/client, service peers, tool registry, review gates, journal codec and small browser presentation primitives. The adapter translates public operations into its product's invariants. Game Engine owns its document store, command bus, scene workspace, C# runtime, renderer, asset processing and transactional MAIN application.

P1 uses protocol 1 over Node child-process IPC, with explicit initialization and ready/status/error responses. P2 adds request-scoped GitHub service traffic. P3 adds AI service traffic, usage and cancellation generations. P4 adds versioned installation selection and Hub project management; changing an installation never hot-swaps a live product process.

All mutation paths keep expected revisions and operation receipts where applicable. Timeouts and process death report unknown/failure rather than fabricated success. Authentication and origin checks protect local HTTP routes. Secrets stay in session memory, not URLs to external services, logs, documents or preferences.

No generic scene kernel is extracted. The product's native startup consumes installed shared modules without requiring the Hub. Standalone games keep no dependency on development services. [Ownership](OWNERSHIP_MATRIX.md), [product contract](PRODUCT_CONTRACT.md), [AI](AI_CONTRACT.md), [data](DATA_AND_SESSIONS.md).
