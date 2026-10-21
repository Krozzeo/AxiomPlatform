# Product contract and Platform SDK

Current Platform package/API line: 0.1.x; IPC protocol 1. Game Engine retains native project schemaVersion 1 and scripting SDK 8. These numbers are independent. The executable manifest validator in packages/contracts is authoritative; the original P0 descriptor was illustrative.

Descriptors declare manifestVersion, protocolVersion, productId, displayName, productVersion, supported Platform API range, supported project format IDs/versions, capabilities and an official-local adapter entry. Register explicitly prepared installations; never execute project-provided shell commands. The adapter entry must resolve inside its installation. Project identity is portable; a local path is not identity.

## Lifecycle

1. Validate the installation/descriptor and detect a project without modifying it.
2. Negotiate protocol, product identity/version, capabilities and authorized roots.
3. Acquire ownership and reject another write owner.
4. Wait for explicit product ready; expose timeout/process failure.
5. Create/open through the product; validate the native document and return revision/status.
6. Save with the expected editor revision. Closing requires Save/Discard/Cancel; pending buffers and active work retain their guards.
7. Release resources on close/failure without silently repairing documents.

P1 requires detect/create/open/status/save/close. P2 adds import and GitHub project listing. P4 adds optional project.rename to the Game Engine descriptor; it preserves project identity, content and format. A rename on a dirty or busy live product is rejected. Closed rename obtains product storage ownership and revision validation.

Messages carry request/session/product identity and correlated results. Mutations include operationId; duplicates return the retained receipt or explicit uncertainty, never blindly repeat effects. Closed generations cannot apply late results. Minimum diagnostics include incompatibleVersion, unsupportedCapability, permissionDenied, projectBusy, revisionConflict, cancelled, operationFailed and resultUnknown. A domain failure is not success because HTTP returned a response.

Host owns registration/permissions/lifecycle; SDK owns generic validation/client; adapter owns translation; product owns document invariants and results. Optional capabilities must perform real work. Conformance tests cover incompatible descriptors/documents without writes, failed processes, lifecycle, stale revisions, service isolation and direct startup.
