# Axiom Platform roadmap — P0 to P5

Six independently accepted milestones. P0/P1 are integrated and P1 manually accepted. P2/P3 are review candidates. P4 is implemented as a review candidate with its standalone exported-game acceptance gate still open; P5 is the owner-approved Math Lab proof of concept, implemented as a review candidate. No promised dates. Close milestones using retained evidence, not file counts. Game Engine keeps its independent M19–M40 Unity/shader/GPU roadmap.

| Milestone | Delivery | Dependency | Acceptance gate |
| --- | --- | --- | --- |
| P0 — Foundation | Master plan, ownership, ADRs, contracts, configuration, AI, compatibility, migration and validation | Owner decisions | Coherent published specification; no functional extraction claimed |
| P1 — Host and first product | Local Hub/host, registration, official Engine adapter, handshake/ready/errors and existing project opening | P0 | Create/open/edit/save/reopen, cancelled close, incompatible project without writes, visible process failure, direct startup |
| P2 — Shared services | Persistent catalog/preferences, native picker/import, authorized storage, session GitHub transport/account with project destinations | P1 | Source preserved, bounded paths, isolated preferences/destinations, disconnect/divergence/reconciliation |
| P3 — AI and changes | Provider/turns/usage, tool registry, shared diff/review/receipts with domain adapters | P2 | Manual and AI work, reviewed apply, conflicts, cancellation, failed provider and late results; real-model evaluation separate |
| P4 — UI and distribution | Unified Hub, separate Settings/accounts, reusable UI primitives, relocatable Windows startup, installation versions/deferred activation/rollback; safe project management | P3 | Compatible package registration, preferences/keyboard, install/activate/rollback/reopen intact, source-preserving import, reviewed deletion, direct product and standalone export preserved |
| P5 — Second consumer | Axiom Math Lab: bounded calculation documents, independent lifecycle and manually reviewed AI edits; generic editor sessions and Hub refinements | P4 | No Game Engine imports; open/save plus one validated AI tool; record necessary SDK adjustments |

## P4 batches

P4.1: launch/bootstrap and diagnostics. P4.2: Hub/Settings and shared icon/selection primitives. P4.3: unified lifecycle, rename, catalog removal and reviewed filesystem deletion. P4.4: independent installations, compatibility, deferred activation and rollback. P4.5: joint regression, distribution smoke, English maintained documentation and manual acceptance guide. These are batches inside P4, not five new main milestones.

A local package being available is distinct from upstream integration. Earlier branch CI failures and manual native/real-account gates remain visible in [the report](reports/P4_REPORT.md). P5 scope is recorded in ADR-P0006; it does not waive P4's game-export gate. Marketplace, cloud, collaboration, full CAD/Math/Animation and cross-product automation remain outside this plan.

P0 has [documentary acceptance](P0_ACCEPTANCE.md); P1–P4 each have reports. Every closure records exact revisions, platform, commands/flows, outcomes and limits. Six milestones are not six equal units of effort; no audited overall functional percentage is assigned.

Current P5 guide: [manual acceptance](P5_GUIDE.md) and [evidence/limits](reports/P5_REPORT.md).
