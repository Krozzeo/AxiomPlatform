# Ownership and extraction matrix

Original inventory: Engine `871a72f`. P1 extracted host/lifecycle through a product adapter; P2 extracted common GitHub/OS/files; P3 extracted generic AI/review; P4 adds verified UI primitives and local distribution. P = Platform; G = Game Engine; split = public port/adapters; later = reuse only after evidence.

| Existing component | Ownership and boundary | Stage / required evidence |
| --- | --- | --- |
| hub-settings and editor Hub | P catalog/preferences; G templates/demos/format validation | P1/P2 real create/open/reopen |
| bootstrap/server | P host/sessions; G domain bootstrap/routes; do not move whole file | P1–P3 direct/hosted startup |
| folder-picker, atomic-file, open-editor | P OS/files infrastructure; G concrete opening/project authorization | P2/P4 cancellation, timeout, bounded paths |
| project-store, scene-workspace, command-bus | G documents/scenes/transactions; P lifecycle/storage contracts | P1–P4 same invariants/persistence |
| github/client | P transport/session account | P2 permissions/errors/disconnect |
| publication, bundle, import-project, history | P transport/scoped metadata location; G game bundle/review/receipts/publication history | P2 divergence and ambiguous-write recovery; generalize receipts only with another real consumer |
| workspaces manager/files/diff | P generic diff/hashes/review/journal; G snapshots/validation/resource transaction | P3 concurrency/cancellation/rollback |
| OpenAiAssistant/agent service | P HTTP/model/turn/cancellation/usage; G game context/instructions/normalization/acceptance | P3 manual and AI paths |
| contracts, typed-tools, handlers | P generic registry/validator; G semantic catalog/handlers | P3 tool conformance |
| editor bridge | P transport/generation contracts; G snapshots/adoption | P3 stale response cannot revert state |
| MCP stdio | Common transport boundary; G domain capabilities | No permission expansion from exposing MCP |
| PMD/document sections/AI history | Generic mechanisms may be shared; content/templates/gates remain G | P3/P4 preserved isolated history; no speculative extraction |
| protocol/messages/errors | P common identity/envelope/diagnostics; G entity/transform/body/project/scripts/replay schemas | P1–P3 validate both sides |
| dock/layout/chat/presentation | P reusable primitives only after proof; G editor composition | P4 shared option/icon primitives and preferences/keyboard; no wholesale dock rewrite |
| main/Hierarchy/Inspector/Scene/specialized editors | G composition and meaning | No general extraction |
| assets/pipeline | G game import/derivatives; common storage/jobs only when proven | P2 contracts; further processing later |
| CAD asset importer | G static importer; not a future parametric kernel | Preserve third-party notices |
| scripting/C#/ABI/bindings | G Unity-compatible runtime; generic runner only with second use | Engine M19–M40 |
| core/Wasm/renderer/physics/audio/animation | G specialized behavior/resources | Engine roadmap; utility reuse only behind proven contract |
| testing/replay | G game tests/replay; P generic task/evidence protocol | Evidence distinct from acceptance |
| demos/tests | G historical regressions; add joint contract tests in both repos | Every batch |
| Rust daemon | G partial daemon; not a replacement for production Node | No imposed rewrite |
| .axiom/dist/target/node_modules | Generated/local, never Platform source | Inspect each distribution |
| ADRs/reports/archive | Product history; Platform links baselines without rewriting results | Permanent |

New code with one-domain meaning belongs to that product. Mixed infrastructure/domain code gets a port before extraction. No circular imports or permanent source-copy integration.
