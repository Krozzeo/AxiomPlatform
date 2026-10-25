# Platform 0.1.9 validation

Local Windows acceptance uses disposable profiles, fake account keys, controlled provider/release HTTP and the real Engine/Math product processes. No user profile, live token, paid model call or real GitHub write is used by these tests.

- General check: 71 cases, 70 pass, zero failures; one existing opt-in native Recycle Bin test is skipped. The new Windows DPAPI protect/unprotect/forget/locked-file test runs and passes.
- Browser profiles pass: P1, P2, P3, P4, P5, MVP, products, installations and providers/jobs. P2 validates encrypted GitHub restoration on Windows. P3 validates isolated domain edits and human Apply, and now expects four actual generations rather than billing a removed connection-generation probe.
- New browser criteria cover model-independent OpenAI connection with a separate404, all four provider selections/tests, preservation of explicit custom model IDs during refresh, local controls, queued Math model edits across polling, outside-click notifications, product-specific creation, gray installed/bold unread version options, persistent hover reads, publication-date sorting, real streamed progress while navigating, scheduled activation and completion toasts.
- Provider cases cover tool/results/usage, destination-bound credentials, local loopback validation, native thinking configuration and signed blocks, token-free local servers, discovery, cancellation/epochs, account persistence, missing installation reconciliation and closed-PR release removal.
- Documentation links, MIT license and architecture boundaries are checked independently.

Initial regression findings were corrected rather than counted as passes: a GitHub repository-array response was incorrectly spread into an object; old UI assertions expected the retired Connect and test label; the P3 usage assertion still included the fixed generation probe that this release removes. Current tests preserve original domain/review/import/rollback assertions.

Generated reports live under `.axiom` and in the delivery sidecar; they are not source credentials or proof of live provider quality. Exact-commit remote CI, published artifact integrity, extracted-package startup and SDK-consumer pins are separate gates whose IDs/hashes must be recorded at delivery. Do not infer main integration from this local report. Linux/macOS secure credential persistence remains unavailable; local runtime installation, real model capability/quality and physical GPU throughput remain separate from controlled HTTP acceptance.
