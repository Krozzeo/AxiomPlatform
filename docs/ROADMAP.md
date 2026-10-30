# Current extension — Platform 0.1.12

Latest experimental build per PR is the default; earlier builds remain installable in history and do not count as new updates. Engineer CAD is registered as planned, with a configurable repository and automatic future release integration; no executable CAD is claimed. Normal startup refreshes local installations, pending activation and remote versions. [Contract and acceptance](CATALOG_HISTORY_AND_ENGINEER_CAD.md). P0–P5 scope, IPC/API versions and product-owned formats remain unchanged.

## Earlier contract and release snapshots

# Axiom Platform roadmap — P0 to P5

P0–P5 feature development is complete in MVP0.1.5. The feature scope is integrated into main through PR6 after successful CI; the reproducible prepared package is recorded separately. Live-account/model/hardware and clean-machine checks remain explicit operational acceptance, not claimed results. ADR-P0007 transfers the standalone game-export requirement to Game Engine, where it remains missing. Game Engine keeps its independent M19–M40 Unity/shader/GPU roadmap.

| Milestone | Delivery | Dependency | Acceptance gate |
| --- | --- | --- | --- |
| P0 — Foundation | Master plan, ownership, ADRs, contracts, configuration, AI, compatibility, migration and validation | Owner decisions | Coherent published specification; no functional extraction claimed |
| P1 — Host and first product | Local Hub/host, registration, official Engine adapter, handshake/ready/errors and existing project opening | P0 | Create/open/edit/save/reopen, cancelled close, incompatible project without writes, visible process failure, direct startup |
| P2 — Shared services | Persistent catalog/preferences, native picker/import, authorized storage, session GitHub transport/account with project destinations | P1 | Source preserved, bounded paths, isolated preferences/destinations, disconnect/divergence/reconciliation |
| P3 — AI and changes | Provider/turns/usage, tool registry, shared diff/review/receipts with domain adapters | P2 | Manual and AI work, reviewed apply, conflicts, cancellation, failed provider and late results; real-model evaluation separate |
| P4 — UI and distribution | Unified Hub, separate Settings/accounts, reusable UI primitives, relocatable Windows startup, installation versions/deferred activation/rollback; safe project management | P3 | Compatible package registration, preferences/keyboard, install/activate/rollback/reopen intact, source-preserving import, reviewed deletion, direct product startup preserved; standalone game export explicitly owned by Engine |
| P5 — Second consumer | Axiom Math Lab: bounded calculation documents, independent lifecycle and manually reviewed AI edits; generic editor sessions and Hub refinements | P4 | No Game Engine imports; open/save plus one validated AI tool; record necessary SDK adjustments |

## P4 batches

P4.1: launch/bootstrap and diagnostics. P4.2: Hub/Settings and shared icon/selection primitives. P4.3: unified lifecycle, rename, catalog removal and reviewed filesystem deletion. P4.4: independent installations, compatibility, deferred activation and rollback. P4.5: joint regression, distribution smoke, English maintained documentation and manual acceptance guide. These are batches inside P4, not five new main milestones.

A local package being available is distinct from upstream integration. Earlier branch CI failures and manual native/real-account gates remain visible in [the report](reports/P4_REPORT.md). P5 scope is recorded in ADR-P0006; ADR-P0007 transfers the game-export gate to its owning product rather than declaring it passed. Marketplace, cloud, collaboration, full CAD/Math/Animation and cross-product automation remain outside this plan.

P0 has [documentary acceptance](P0_ACCEPTANCE.md); P1–P4 each have reports. Every closure records exact revisions, platform, commands/flows, outcomes and limits. Six milestones are not six equal units of effort; no audited overall functional percentage is assigned.

Historical P5 candidate guide: [manual acceptance](P5_GUIDE.md) and [evidence/limits](reports/P5_REPORT.md).

Current authority: [MVP closure](MVP_CLOSURE.md), [guide](MVP_GUIDE.md), [ownership decision](adr/0007-mvp-closure.md). Earlier candidate/export-gate reports are historical and superseded by that explicit owner decision.

P0, P1, P2, P3, P4 and P5 development status: **complete** within the scope of ADR-P0007. No additional MVP phase is pending. Source integration/evidence: [closure record](MVP_CLOSURE.md). Operational validation remains explicit.
